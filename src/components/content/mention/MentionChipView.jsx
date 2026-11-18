import { NodeViewWrapper } from '@tiptap/react'
import ActorMinimalCard from '../../actor/ActorMinimalCard'
import TribeMinimalCard from '../../tribe/TribeMinimalCard'
import { MentionTargetType } from '../../../constants/enums'

/** TipTap node view for a mention inside the editor; the card opens in a new tab so the draft survives. */
export default function MentionChipView({ node }) {
  const { targetType, entity } = node.attrs

  return (
    <NodeViewWrapper as="span" className="mention-node" contentEditable={false}>
      {targetType === MentionTargetType.Tribe ? (
        <TribeMinimalCard tribe={entity} variant="inline" linkTarget="_blank" />
      ) : (
        <ActorMinimalCard actor={entity} variant="inline" linkTarget="_blank" />
      )}
    </NodeViewWrapper>
  )
}
