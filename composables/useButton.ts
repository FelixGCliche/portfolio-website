export const useButtonProps = () => ({
  url: {
    type: String
  },
  label: {
    type: String
  }
})

export const useButtonType = (url?: string) => {
  if (!url) {
    return 'button'
  }

  return 'a'
}
