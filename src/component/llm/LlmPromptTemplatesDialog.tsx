import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PanResponder, ScrollView, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { Dialog, Portal, Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { LlmPromptTemplate, Styling, t, useTheme } from '../../lib'
import { confirm } from '../ConfirmationDialog'
import { DoubleTapDeleteButton } from '../DoubleTapDeleteButton'

type Mode = 'save' | 'pick'

type Props = {
  visible: boolean
  mode: Mode
  prompt: string
  templates: LlmPromptTemplate[]
  onDismiss: () => void
  onCreate: (name: string) => void
  onOverwrite: (template: LlmPromptTemplate) => void
  onPick: (template: LlmPromptTemplate) => void
  onDelete: (template: LlmPromptTemplate) => void
  onReorder: (ids: string[]) => void
}

const SQUARE = 36
const EDGE = 48

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const shiftRow = (index: number, drag: { from: number; to: number }, stride: number) => {
  if (index === drag.from) {
    return (drag.to - drag.from) * stride
  }
  if (drag.from < drag.to && index > drag.from && index <= drag.to) {
    return -stride
  }
  if (drag.to < drag.from && index >= drag.to && index < drag.from) {
    return stride
  }
  return 0
}

const moveRow = (rows: LlmPromptTemplate[], from: number, to: number) => {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
    return rows
  }
  const next = rows.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const LlmPromptTemplatesDialog: React.FC<Props> = ({
  visible,
  mode,
  prompt,
  templates,
  onDismiss,
  onCreate,
  onOverwrite,
  onPick,
  onDelete,
  onReorder,
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const { height: screenHeight } = useWindowDimensions()
  const [name, setName] = useState('')
  const [rows, setRows] = useState(templates)
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const rowsRef = useRef(templates)
  const templatesRef = useRef(templates)
  const onReorderRef = useRef(onReorder)
  const dragging = useRef(false)
  const dragFrom = useRef(-1)
  const dragTo = useRef(-1)
  const fingerY = useRef(0)
  const rowsTop = useRef(0)
  const strideRef = useRef(SQUARE + blocks.small)
  const scrollRef = useRef<ScrollView>(null)
  const rowsHost = useRef<View>(null)
  const scrollY = useRef(0)
  const contentH = useRef(0)
  const viewportTop = useRef(0)
  const viewportH = useRef(0)
  const raf = useRef(0)
  const api = useRef({
    begin: (_id: string, _pageY: number) => {},
    move: (_pageY: number) => {},
    end: () => {},
  })

  templatesRef.current = templates
  onReorderRef.current = onReorder
  const templateKey = templates.map(item => item.id).join('\n')

  useEffect(() => {
    if (visible) {
      setName('')
    }
  }, [visible])

  useEffect(() => {
    if (dragging.current) {
      return
    }
    rowsRef.current = templatesRef.current
    setRows(templatesRef.current)
  }, [templateKey])

  useEffect(
    () => () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current)
      }
    },
    [],
  )

  const relocate = () => {
    const stride = strideRef.current || 1
    const next = clamp(Math.floor((fingerY.current - rowsTop.current) / stride), 0, rowsRef.current.length - 1)
    if (dragFrom.current < 0 || next === dragTo.current) {
      return
    }
    dragTo.current = next
    setDrag({ from: dragFrom.current, to: next })
  }

  const scrollBy = (dy: number) => {
    const maxScroll = Math.max(0, contentH.current - viewportH.current)
    const next = clamp(scrollY.current + dy, 0, maxScroll)
    const applied = next - scrollY.current
    if (applied === 0) {
      return
    }
    scrollY.current = next
    rowsTop.current -= applied
    scrollRef.current?.scrollTo({ y: next, animated: false })
    relocate()
  }

  api.current.begin = (id, pageY) => {
    const index = rowsRef.current.findIndex(item => item.id === id)
    if (index < 0) {
      return
    }
    dragFrom.current = index
    dragTo.current = index
    dragging.current = true
    fingerY.current = pageY
    setDrag({ from: index, to: index })
    rowsHost.current?.measureInWindow((_x, y) => {
      rowsTop.current = y
      relocate()
    })
    scrollRef.current?.measureInWindow((_x, y, _w, h) => {
      viewportTop.current = y
      viewportH.current = h
    })
    if (raf.current) {
      cancelAnimationFrame(raf.current)
    }
    const tick = () => {
      if (!dragging.current) {
        return
      }
      const top = viewportTop.current
      const bottom = top + viewportH.current
      const y = fingerY.current
      if (viewportH.current > 0 && y < top + EDGE && scrollY.current > 0) {
        const depth = clamp(top + EDGE - y, 0, EDGE)
        scrollBy(-Math.max(4, Math.round((depth / EDGE) * 22)))
      } else if (viewportH.current > 0 && y > bottom - EDGE) {
        const depth = clamp(y - (bottom - EDGE), 0, EDGE)
        scrollBy(Math.max(4, Math.round((depth / EDGE) * 22)))
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  api.current.move = pageY => {
    fingerY.current = pageY
    relocate()
  }
  api.current.end = () => {
    if (!dragging.current) {
      return
    }
    const from = dragFrom.current
    const to = dragTo.current
    dragging.current = false
    dragFrom.current = -1
    dragTo.current = -1
    if (raf.current) {
      cancelAnimationFrame(raf.current)
    }
    setDrag(null)
    if (from < 0 || to < 0 || from === to) {
      return
    }
    const moved = moveRow(rowsRef.current, from, to)
    rowsRef.current = moved
    setRows(moved)
    onReorderRef.current(moved.map(item => item.id))
  }

  const square = {
    width: SQUARE,
    height: SQUARE,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
  }
  const buttonFill = colors.row || colors.surface

  const overwrite = async (template: LlmPromptTemplate) => {
    const ok = await confirm(
      t('llm.templateOverwrite'),
      `${t('llm.templateOverwriteBody')}`.replace('%s', template.name),
    )
    if (ok) {
      onOverwrite(template)
    }
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.ScrollArea style={{ paddingLeft: 5, paddingRight: 5 }}>
          <ScrollView
            ref={scrollRef}
            style={{ marginVertical: 5, maxHeight: Math.max(240, screenHeight - 160) }}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            nestedScrollEnabled
            onScroll={event => {
              scrollY.current = event.nativeEvent.contentOffset.y
            }}
            onContentSizeChange={(_width, height) => {
              contentH.current = height
            }}
            onLayout={event => {
              viewportH.current = event.nativeEvent.layout.height
            }}>
            <View
              style={[
                Styling.groups.flexRowSpbCentered,
                { paddingHorizontal: blocks.small, minHeight: fontSizes.h1 },
              ]}>
              <Text style={{ fontSize: fontSizes.p }}>
                {mode === 'save' ? t('llm.templateSave') : t('llm.template')}
              </Text>
              <Text style={{ fontSize: fontSizes.p }}>{rows.length}</Text>
            </View>
            {mode === 'save' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: blocks.small,
                  paddingLeft: blocks.small,
                }}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('llm.templateName')}
                  placeholderTextColor={colors.faded}
                  selectionColor={colors.primary}
                  style={{
                    flex: 1,
                    height: SQUARE,
                    marginRight: blocks.small,
                    paddingHorizontal: blocks.medium,
                    fontSize: fontSizes.p,
                    color: colors.text,
                    backgroundColor: buttonFill,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const trimmed = name.trim()
                    if (!trimmed || !prompt.trim()) {
                      return
                    }
                    onCreate(trimmed)
                    setName('')
                  }}
                  style={{
                    ...square,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: buttonFill,
                  }}>
                  <Icon name="plus" size={fontSizes.p} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
            {rows.length === 0 && (
              <Text
                style={{
                  color: colors.faded,
                  fontSize: fontSizes.p,
                  marginTop: blocks.small,
                  paddingHorizontal: blocks.small,
                }}>
                {t('llm.templateEmpty')}
              </Text>
            )}
            <View ref={rowsHost} collapsable={false}>
              {rows.map((template, index) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  api={api}
                  dragging={drag?.from === index}
                  offset={(drag && shiftRow(index, drag, strideRef.current)) || 0}
                  gap={blocks.small}
                  fill={buttonFill}
                  fontSize={fontSizes.p}
                  textColor={colors.text}
                  faded={colors.faded}
                  ripple={colors.ripple}
                  square={square}
                  onLayoutHeight={height => {
                    if (height > 0) {
                      strideRef.current = height
                    }
                  }}
                  onPress={() => (mode === 'save' ? overwrite(template) : onPick(template))}
                  onDelete={() => onDelete(template)}
                />
              ))}
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  )
}

type RowProps = {
  template: LlmPromptTemplate
  api: React.MutableRefObject<{ begin: (id: string, pageY: number) => void; move: (pageY: number) => void; end: () => void }>
  dragging: boolean
  offset: number
  gap: number
  fill: string
  fontSize: number
  textColor: string
  faded: string
  ripple: string
  square: { width: number; height: number; paddingHorizontal: number; paddingVertical: number; borderRadius: number; borderWidth: number }
  onLayoutHeight: (height: number) => void
  onPress: () => void
  onDelete: () => void
}

const TemplateRow: React.FC<RowProps> = ({
  template,
  api,
  dragging,
  offset,
  gap,
  fill,
  fontSize,
  textColor,
  faded,
  ripple,
  square,
  onLayoutHeight,
  onPress,
  onDelete,
}) => {
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: event => api.current.begin(template.id, event.nativeEvent.pageY),
        onPanResponderMove: event => api.current.move(event.nativeEvent.pageY),
        onPanResponderRelease: () => api.current.end(),
        onPanResponderTerminate: () => api.current.end(),
      }),
    [api, template.id],
  )
  return (
    <View
      onLayout={event => onLayoutHeight(event.nativeEvent.layout.height)}
      style={{
        paddingTop: gap,
        opacity: dragging ? 0.92 : 1,
        zIndex: dragging ? 2 : 0,
        elevation: dragging ? 4 : 0,
        transform: offset ? [{ translateY: offset }] : undefined,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: SQUARE,
          backgroundColor: fill,
          borderLeftWidth: 3,
          borderColor: 'transparent',
        }}>
        <View
          {...pan.panHandlers}
          style={{ width: SQUARE, height: SQUARE, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="menu" size={fontSize} color={faded} />
        </View>
        <TouchableRipple style={{ flex: 1, paddingVertical: gap, paddingRight: gap }} rippleColor={ripple} onPress={onPress}>
          <Text numberOfLines={1} style={{ fontSize, color: textColor }}>
            {template.name}
          </Text>
        </TouchableRipple>
        <DoubleTapDeleteButton
          onDelete={onDelete}
          iconSize={fontSize}
          idleBackgroundColor={fill}
          iconColor={textColor}
          style={square}
        />
      </View>
    </View>
  )
}
