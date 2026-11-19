import { useEffect, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor, EditorContent, ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Mention from '@tiptap/extension-mention'
import { Placeholder, UndoRedo } from '@tiptap/extensions'
import { MentionTargetType } from '../../../constants/enums'
import MentionChipView from './MentionChipView'
import MentionSuggestionList from './MentionSuggestionList'
import { MENTION_NODE, contentToDoc, docToPayload } from './mentionUtils'

const MentionNode = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      targetType: { default: MentionTargetType.Actor, rendered: false },
      entity: { default: null, rendered: false },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(MentionChipView, { as: 'span' })
  },
})

const VIEWPORT_GUTTER = 16

function createSuggestionRenderer() {
  let renderer = null
  let unmount = null
  let positioned = false
  return {
    onStart: (props) => {
      renderer = new ReactRenderer(MentionSuggestionList, { props, editor: props.editor })
      renderer.element.classList.add('mention-suggestion-root')
      renderer.element.style.visibility = 'hidden'
      unmount = props.mount(renderer.element, {
        onPosition: ({ x, y, strategy }) => {
          if (!renderer) return
          const width = renderer.element.offsetWidth || 300
          const scrollOffsetX = strategy === 'fixed' ? 0 : window.scrollX
          const minX = scrollOffsetX + VIEWPORT_GUTTER
          const maxX = Math.max(minX, scrollOffsetX + window.innerWidth - width - VIEWPORT_GUTTER)
          const clampedX = Math.max(minX, Math.min(x, maxX))
          Object.assign(renderer.element.style, {
            position: strategy,
            left: `${clampedX}px`,
            top: `${y}px`,
          })
          if (!positioned) {
            positioned = true
            renderer.element.style.visibility = ''
          }
        },
      })
    },
    onUpdate: (props) => renderer?.updateProps(props),
    onKeyDown: (props) => renderer?.ref?.onKeyDown(props) ?? false,
    onExit: () => {
      unmount?.()
      unmount = null
      positioned = false
      renderer?.destroy()
      renderer = null
    },
  }
}

/**
 * Plain-text content editor with @mentions (TipTap). Only paragraphs, text and mention nodes
 * exist in the schema, so pasted rich text is reduced to plain text.
 *
 * onChange receives { content, mentions, mentionDtos } — see docToPayload.
 * The imperative ref exposes clear() and focus().
 */
export default function MentionEditor({
  ref,
  initialContent = '',
  initialMentions = null,
  placeholder = '',
  onChange,
  disabled = false,
  invalid = false,
  autoFocus = false,
  className = '',
  style,
}) {
  const { t } = useTranslation()
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      UndoRedo,
      Placeholder.configure({ placeholder }),
      MentionNode.configure({
        deleteTriggerWithBackspace: true,
        renderText: ({ node }) => `@${node.attrs.label}`,
        suggestion: {
          char: '@',
          allowSpaces: false,
          items: () => [],
          command: ({ editor: ed, range, props }) => {
            ed.chain()
              .focus()
              .insertContentAt(range, [
                { type: MENTION_NODE, attrs: props },
                { type: 'text', text: ' ' },
              ])
              .run()
          },
          render: createSuggestionRenderer,
        },
      }),
    ],
    content: contentToDoc(initialContent, initialMentions, t('mention.deleted')),
    editable: !disabled,
    autofocus: autoFocus ? 'end' : false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'mention-editor-content',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => onChangeRef.current?.(docToPayload(ed.state.doc)),
  })

  useEffect(() => {
    if (editor && editor.isEditable === disabled) editor.setEditable(!disabled)
  }, [editor, disabled])

  useImperativeHandle(
    ref,
    () => ({
      clear: () => editor?.commands.clearContent(true),
      focus: () => editor?.commands.focus('end'),
    }),
    [editor]
  )

  return (
    <div
      className={`input textarea mention-editor${invalid ? ' error' : ''}${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      onMouseDown={(e) => {
        // clicks on the padding area should still place the caret (preserve native bottom-right resize handle)
        if (e.target === e.currentTarget && editor) {
          const rect = e.currentTarget.getBoundingClientRect()
          if (rect.right - e.clientX <= 18 && rect.bottom - e.clientY <= 18) return
          e.preventDefault()
          editor.commands.focus('end')
        }
      }}
    >
      <EditorContent editor={editor} />
      <span className="mention-editor-hint" aria-hidden="true">
        {t('mention.hint')}
      </span>
    </div>
  )
}
