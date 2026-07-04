import type { LanguageId } from '@/lib/problems'
import { grammarForLanguage } from '@/lib/prism-languages'
import type { Token, TokenStream } from 'prismjs'
import Prism from 'prismjs'
import { useMemo, type ReactNode } from 'react'
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from 'react-native'

/**
 * One-dark–inspired palette on #0f1014.
 * Slightly higher luminance than desktop themes so code stays readable on phones
 * (outdoor / auto-brightness) and under the transparent TextInput overlay on Android.
 */
const COLORS: Record<string, string> = {
  plain: '#f4f4f5',
  default: '#f4f4f5',
  comment: '#86c47a',
  prolog: '#86c47a',
  doctype: '#86c47a',
  cdata: '#86c47a',
  punctuation: '#d4d4d8',
  namespace: '#f4878a',
  property: '#f0c674',
  tag: '#f4878a',
  boolean: '#e5a060',
  number: '#e5a060',
  constant: '#6ad0e0',
  symbol: '#6ad0e0',
  deleted: '#f4878a',
  selector: '#a6d98c',
  'attr-name': '#e5a060',
  string: '#a6d98c',
  char: '#a6d98c',
  builtin: '#f0c674',
  inserted: '#a6d98c',
  operator: '#6ad0e0',
  entity: '#f0c674',
  url: '#a6d98c',
  variable: '#f4878a',
  atrule: '#d69ff0',
  'attr-value': '#a6d98c',
  function: '#7cc4f5',
  'class-name': '#f0c674',
  regex: '#a6d98c',
  important: '#d69ff0',
  keyword: '#d69ff0',
  bold: '#f4f4f5',
  italic: '#f4f4f5',
}

export type CodeEditorProps = {
  value: string
  onValueChange: (text: string) => void
  language: LanguageId
  minHeight?: number
  placeholder?: string
}

const H_PAD = 12
const V_PAD = 12

function colorForToken(type: string): string {
  return COLORS[type] ?? COLORS.plain
}

function renderItem(
  item: string | Token,
  key: string,
  textStyle: TextStyle
): ReactNode {
  if (typeof item === 'string') {
    return (
      <Text key={key} style={[textStyle, { color: COLORS.plain }]}>
        {item}
      </Text>
    )
  }
  const token = item
  const fg = colorForToken(token.type)
  const content = token.content
  if (typeof content === 'string') {
    return (
      <Text key={key} style={[textStyle, { color: fg }]}>
        {content}
      </Text>
    )
  }
  return (
    <Text key={key} style={[textStyle, { color: fg }]}>
      {renderTokenStream(content, `${key}-c`, textStyle)}
    </Text>
  )
}

function renderTokenStream(
  stream: TokenStream,
  path: string,
  textStyle: TextStyle
): ReactNode[] {
  if (typeof stream === 'string') {
    return [renderItem(stream, path, textStyle)]
  }
  if (Array.isArray(stream)) {
    return stream.map((item, i) => renderItem(item, `${path}-${i}`, textStyle))
  }
  return [renderItem(stream, path, textStyle)]
}

function highlightToNodes(
  code: string,
  language: LanguageId,
  textStyle: TextStyle
): ReactNode[] | null {
  if (!code) return null
  try {
    const grammar = grammarForLanguage(language)
    if (!grammar) {
      return [
        <Text key="plain" style={[textStyle, { color: COLORS.plain }]}>
          {code}
        </Text>,
      ]
    }
    const tokens = Prism.tokenize(code, grammar) as TokenStream
    return renderTokenStream(tokens, 't', textStyle)
  } catch {
    return [
      <Text key="fallback" style={[textStyle, { color: COLORS.plain }]}>
        {code}
      </Text>,
    ]
  }
}

export function CodeEditor({
  value,
  onValueChange,
  language,
  minHeight = 280,
  placeholder = '// Write your solution here',
}: CodeEditorProps) {
  const textStyle = useMemo(
    () => ({
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'Courier',
      }) as string,
      fontSize: 14,
      lineHeight: 22,
      /** Base color so nested spans and any fallback text are always high-contrast */
      color: COLORS.plain,
      ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    }),
    []
  )

  const highlighted = useMemo(
    () => highlightToNodes(value, language, textStyle),
    [value, language, textStyle]
  )

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      {/* Prism layer (read-only), 1:1 under the TextInput */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { paddingHorizontal: H_PAD, paddingVertical: V_PAD },
        ]}
        pointerEvents="none"
      >
        <Text style={textStyle} selectable={false}>
          {highlighted}
        </Text>
      </View>

      <TextInput
        value={value}
        onChangeText={onValueChange}
        multiline
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        scrollEnabled={false}
        placeholder={placeholder}
        placeholderTextColor="#71717a"
        underlineColorAndroid="transparent"
        selectionColor="rgba(189, 240, 110, 0.45)"
        {...(Platform.OS === 'android'
          ? { cursorColor: '#f4f4f5' as const }
          : {})}
        style={[
          textStyle,
          {
            position: 'relative',
            zIndex: 1,
            minHeight,
            paddingHorizontal: H_PAD,
            paddingVertical: V_PAD,
            textAlignVertical: 'top',
            /**
             * Android often treats the keyword `transparent` as low-alpha grey and draws
             * it on top of the syntax layer, washing out the highlight. Full alpha-0 fixes it.
             */
            color: 'rgba(255,255,255,0)',
            backgroundColor: 'transparent',
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
          },
        ]}
      />
    </View>
  )
}
