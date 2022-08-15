import { BaseIconProps } from 'types/BaseIconProps'

export const useBaseIconProps = (props?: BaseIconProps) => ({
  iconName: {
    type: String,
    default: props.iconName
  },
  size: {
    type: Number,
    default: props.size
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})
