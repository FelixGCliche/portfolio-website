import { describe, expect, test } from 'bun:test'

import { profile } from '@content'

import { isSafeHref } from '@features/safe-links'

import { type MdBlock, type MdInline, parseMarkdown } from './parse'

const email = profile[0]?.email ?? ''

const text = (value: string): MdInline => ({ type: 'text', text: value })
const paragraph = (...inlines: MdInline[]): MdBlock => ({ type: 'paragraph', inlines })
/** The inlines of a single-paragraph source. */
const inlines = (src: string) => {
  const [block, ...rest] = parseMarkdown(src)
  expect(rest).toEqual([])
  expect(block?.type).toBe('paragraph')
  return block?.type === 'paragraph' ? block.inlines : []
}

const collectLinks = (nodes: ReadonlyArray<MdInline>): string[] =>
  nodes.flatMap((node) => {
    if (node.type === 'link') return [node.href, ...collectLinks(node.children)]
    if (node.type === 'strong' || node.type === 'em') return collectLinks(node.children)
    return []
  })

const blockLinks = (blocks: ReadonlyArray<MdBlock>) =>
  blocks.flatMap((block) =>
    block.type === 'paragraph' ? collectLinks(block.inlines) : block.items.flatMap(collectLinks)
  )

describe('blocks', () => {
  test('returns nothing for empty or blank input', () => {
    expect(parseMarkdown('')).toEqual([])
    expect(parseMarkdown('  \n\n \t\n')).toEqual([])
  })

  test('splits paragraphs on blank lines and keeps line breaks inside one', () => {
    expect(parseMarkdown('one\ntwo\n\n  \nthree')).toEqual([
      paragraph(text('one\ntwo')),
      paragraph(text('three')),
    ])
  })

  test('normalises CRLF line endings', () => {
    expect(parseMarkdown('a\r\nb\r\n\r\nc')).toEqual([
      paragraph(text('a\nb')),
      paragraph(text('c')),
    ])
  })

  test.each(['- ', '* ', '• '])('groups "%s" lines into an unordered list', (marker) => {
    expect(parseMarkdown(`${marker}one\n${marker}**two**`)).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [[text('one')], [{ type: 'strong', children: [text('two')] }]],
      },
    ])
  })

  test('groups numbered lines into an ordered list', () => {
    expect(parseMarkdown('1. one\n2. two\n10. ten')).toEqual([
      {
        type: 'list',
        ordered: true,
        start: 1,
        items: [[text('one')], [text('two')], [text('ten')]],
      },
    ])
  })

  test('keeps the source start number of an ordered list', () => {
    expect(parseMarkdown('3. three\n4. four')).toEqual([
      { type: 'list', ordered: true, start: 3, items: [[text('three')], [text('four')]] },
    ])
  })

  test('keeps a loose list together across blank lines', () => {
    expect(parseMarkdown('1. Foo\n\n2. Bar\n\n\n3. Baz')).toEqual([
      {
        type: 'list',
        ordered: true,
        start: 1,
        items: [[text('Foo')], [text('Bar')], [text('Baz')]],
      },
    ])
    expect(parseMarkdown('- a\n\n- b\n\nafter')).toEqual([
      { type: 'list', ordered: false, items: [[text('a')], [text('b')]] },
      paragraph(text('after')),
    ])
  })

  test('ends a list at a blank line followed by another list kind', () => {
    expect(parseMarkdown('- a\n\n1. b')).toEqual([
      { type: 'list', ordered: false, items: [[text('a')]] },
      { type: 'list', ordered: true, start: 1, items: [[text('b')]] },
    ])
  })

  test('starts a new list when the list kind changes', () => {
    expect(parseMarkdown('- a\n1. b')).toEqual([
      { type: 'list', ordered: false, items: [[text('a')]] },
      { type: 'list', ordered: true, start: 1, items: [[text('b')]] },
    ])
  })

  test('separates a list from surrounding paragraph lines', () => {
    expect(parseMarkdown('Intro:\n- a\n- b\nOutro')).toEqual([
      paragraph(text('Intro:')),
      { type: 'list', ordered: false, items: [[text('a')], [text('b')]] },
      paragraph(text('Outro')),
    ])
  })

  test('appends indented continuation lines to the last list item', () => {
    expect(parseMarkdown('- a\n  more\n- b')).toEqual([
      { type: 'list', ordered: false, items: [[text('a\nmore')], [text('b')]] },
    ])
  })

  test('does not treat markers without a following space as list items', () => {
    expect(parseMarkdown('-5 degrees\n*not a list*')).toEqual([
      paragraph(text('-5 degrees\n'), { type: 'em', children: [text('not a list')] }),
    ])
  })

  test.each(['# Title', '### Title', '###### Title ##'])(
    'renders heading %p as a bold paragraph',
    (src) => {
      expect(parseMarkdown(`${src}\nbody`)).toEqual([
        paragraph({ type: 'strong', children: [text('Title')] }),
        paragraph(text('body')),
      ])
    }
  )

  test('keeps a hash without a space, or seven hashes, as text', () => {
    expect(inlines('#hashtag')).toEqual([text('#hashtag')])
    expect(inlines('####### seven')).toEqual([text('####### seven')])
  })
})

describe('inlines', () => {
  test('parses code spans literally', () => {
    expect(inlines('run `**not bold** [x](/about)` now')).toEqual([
      text('run '),
      { type: 'code', text: '**not bold** [x](/about)' },
      text(' now'),
    ])
  })

  test('supports double-backtick code spans containing a backtick', () => {
    expect(inlines('``a ` b``')).toEqual([{ type: 'code', text: 'a ` b' }])
  })

  test('leaves a topic key code span as code', () => {
    expect(inlines('see `/work`')).toEqual([text('see '), { type: 'code', text: '/work' }])
  })

  test.each([
    ['**bold**', 'strong'],
    ['__bold__', 'strong'],
    ['*em*', 'em'],
    ['_em_', 'em'],
  ] as const)('parses %s as %s', (src, type) => {
    expect(inlines(src)).toEqual([
      { type, children: [text(src.slice(type === 'strong' ? 2 : 1, type === 'strong' ? -2 : -1))] },
    ])
  })

  test('nests em inside strong and strong inside em', () => {
    expect(inlines('**a *b* c**')).toEqual([
      { type: 'strong', children: [text('a '), { type: 'em', children: [text('b')] }, text(' c')] },
    ])
    expect(inlines('*a **b** c*')).toEqual([
      { type: 'em', children: [text('a '), { type: 'strong', children: [text('b')] }, text(' c')] },
    ])
    expect(inlines('***both***')).toEqual([
      { type: 'strong', children: [{ type: 'em', children: [text('both')] }] },
    ])
  })

  test('lets emphasis span line breaks in a paragraph', () => {
    expect(inlines('**a\nb**')).toEqual([{ type: 'strong', children: [text('a\nb')] }])
  })

  test('keeps snake_case and intra-word underscores literal', () => {
    expect(inlines('use snake_case_name and __init__ss')).toEqual([
      text('use snake_case_name and __init__ss'),
    ])
  })

  test('keeps markers surrounded by spaces literal', () => {
    expect(inlines('2 * 3 * 4 and a ** b')).toEqual([text('2 * 3 * 4 and a ** b')])
  })

  test('honours backslash escapes', () => {
    expect(inlines('\\*not em\\* and \\[x\\]')).toEqual([text('*not em* and [x]')])
  })

  test('parses links with safe hrefs', () => {
    expect(
      inlines('see [my **work**](/work) and [GitHub](https://github.com/FelixGCliche)')
    ).toEqual([
      text('see '),
      {
        type: 'link',
        href: '/work',
        children: [text('my '), { type: 'strong', children: [text('work')] }],
      },
      text(' and '),
      { type: 'link', href: 'https://github.com/FelixGCliche', children: [text('GitHub')] },
    ])
    expect(inlines(`[mail](mailto:${email}?subject=Hi)`)).toEqual([
      { type: 'link', href: `mailto:${email}?subject=Hi`, children: [text('mail')] },
    ])
  })

  test.each([
    'javascript:alert(1)',
    'https://evil.com',
    'http://github.com/x',
    '//github.com/x',
    'https://github.com.evil.com/',
    'data:text/html,hi',
    '/nope',
  ])('renders a link to %p as its label only', (href) => {
    expect(inlines(`click [**here**](${href}) now`)).toEqual([
      text('click '),
      { type: 'strong', children: [text('here')] },
      text(' now'),
    ])
  })

  test('does not nest links inside a link label', () => {
    expect(inlines('[a [b](/work)](/about)')).toEqual([
      { type: 'link', href: '/about', children: [text('a [b](/work)')] },
    ])
  })

  test('keeps a bracket without a link target literal', () => {
    expect(inlines('[note] and [x] (y)')).toEqual([text('[note] and [x] (y)')])
  })

  test('keeps raw HTML as literal text', () => {
    expect(inlines('<script>alert(1)</script> <a href="javascript:x">y</a>')).toEqual([
      text('<script>alert(1)</script> <a href="javascript:x">y</a>'),
    ])
  })
})

describe('streaming', () => {
  test('keeps unclosed markers literal', () => {
    expect(inlines('**bold te')).toEqual([text('**bold te')])
    expect(inlines('*em')).toEqual([text('*em')])
    expect(inlines('`code')).toEqual([text('`code')])
    expect(inlines('**bold*')).toEqual([text('**bold*')])
  })

  test('never emits a link before its href is complete', () => {
    for (const src of ['[foo', '[foo]', '[foo](', '[foo](htt', '[foo](https://github.com/Fel']) {
      expect(blockLinks(parseMarkdown(src))).toEqual([])
    }
    expect(blockLinks(parseMarkdown('[foo](https://github.com/Fel)'))).toEqual([
      'https://github.com/Fel',
    ])
  })

  const samples = [
    `# About me\n\nI'm a **software developer** with *five years* of experience, mostly in \`TypeScript\` and snake_case_land.\n\n- Built [my work](/work) with ***care***\n- Reach me at [email](mailto:${email}?subject=Hello)\n* Or on [GitHub](https://github.com/FelixGCliche) and [LinkedIn](https://www.linkedin.com/in/x)\n\n1. Bad [link](javascript:alert(1)) here\n2. <b>raw</b> and [evil](https://github.com.evil.com/) \\*escaped\\*\n\n## Next\nSee \`/skills\` or [skills](/skills).`,
    '**a *b `c` d* [e](/about)** __f _g_ h__ [[x]](/work) `` y ` z `` \\_lit\\_',
    '*** ** * __ _ ` `` [ ] ( ) [](/about) [x]( /work ) [y](/work "t") **[z](/resume)**',
  ]

  test.each(samples.map((sample, index) => [index, sample] as const))(
    'every prefix of sample %d parses without throwing and links only to safe hrefs',
    (_, sample) => {
      for (let end = 0; end <= sample.length; end++) {
        const blocks = parseMarkdown(sample.slice(0, end))
        for (const href of blockLinks(blocks)) expect(isSafeHref(href)).toBe(true)
      }
    }
  )

  test('the rich sample renders its safe links and drops the unsafe ones', () => {
    expect(blockLinks(parseMarkdown(samples[0] ?? ''))).toEqual([
      '/work',
      `mailto:${email}?subject=Hello`,
      'https://github.com/FelixGCliche',
      'https://www.linkedin.com/in/x',
      '/skills',
    ])
  })
})
