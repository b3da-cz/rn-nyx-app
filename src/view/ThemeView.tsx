import React, { Component } from 'react'
import { Appearance, ScrollView, StatusBar, ToastAndroid, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { FAB, Provider as PaperProvider } from 'react-native-paper'
import {
  androidStackBottomInset,
  ComponentExamplesComponent,
  FormRowSelectComponent,
  SafeBottom,
  SectionHeaderComponent,
  StackHeaderComponent,
} from '../component'
import {
  defaultThemeOptions,
  exportTheme,
  MainContext,
  Storage,
  t,
  Theme,
  ThemeContext,
  IBMColorPalette,
  createTheme,
  Nyx,
  ThemeOptions,
} from '../lib'

type Props = {
  config: any
  onConfigChange: Function
  navigation?: any
}
type State = {
  theme: Theme
  themeOptions: ThemeOptions
  selectedTheme: string
}
export class ThemeView extends Component<Props, State> {
  static contextType = MainContext
  nyx?: Nyx
  hasChanges = false
  unsubscribeBlur?: () => void

  constructor(props) {
    super(props)
    const config = props.config
    const themeOptions = config?.themeOptions || { ...defaultThemeOptions }
    const selectedTheme = config?.theme || 'system'
    const isDark =
      selectedTheme === 'system'
        ? Appearance.getColorScheme() === 'dark'
        : selectedTheme === 'dark'
    this.state = {
      themeOptions,
      selectedTheme,
      theme: createTheme({ ...themeOptions, isDarkTheme: isDark }),
    }
  }

  async componentDidMount() {
    this.nyx = (this.context as any)?.nyx
    if (!this.props.config) {
      const conf = await Storage.getConfig()
      if (conf) {
        const themeOptions = conf.themeOptions || { ...defaultThemeOptions }
        const selectedTheme = conf.theme || 'system'
        this.updatePreview(themeOptions, selectedTheme)
      }
    }
    if (this.props.navigation?.addListener) {
      this.unsubscribeBlur = this.props.navigation.addListener('beforeRemove', () => {
        if (this.hasChanges) {
          this.hasChanges = false
          this.props.onConfigChange?.()
        }
      })
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeBlur) {
      this.unsubscribeBlur()
    }
    if (this.hasChanges) {
      this.hasChanges = false
      this.props.onConfigChange?.()
    }
  }

  updatePreview(themeOptions: ThemeOptions, selectedTheme: string) {
    const isDark =
      selectedTheme === 'system'
        ? Appearance.getColorScheme() === 'dark'
        : selectedTheme === 'dark'
    const theme = createTheme({ ...themeOptions, isDarkTheme: isDark })
    this.setState({ themeOptions, selectedTheme, theme })
    this.props.navigation?.setOptions?.({
      header: props => <StackHeaderComponent {...props} theme={theme} />,
    })
  }

  exportTheme() {
    const data = { ...this.state.themeOptions }
    Clipboard.setString(exportTheme(data))
    // Clipboard.setString(`nnn://theme::${encodeURIComponent(JSON.stringify(data))}`)
    ToastAndroid.showWithGravity(t('coppied'), ToastAndroid.LONG, ToastAndroid.BOTTOM)
  }

  async setSelectedTheme(theme: string) {
    this.hasChanges = true
    const themeOptions = this.state.themeOptions || { ...defaultThemeOptions }
    this.updatePreview(themeOptions, theme)
    const conf = (await Storage.getConfig()) || {}
    conf.theme = theme
    await Storage.setConfig(conf)
    this.props.onConfigChange?.()
  }

  async setThemeOption(key, val) {
    this.hasChanges = true
    const themeOptions = { ...(this.state.themeOptions || defaultThemeOptions), [key]: val }
    const selectedTheme = this.state.selectedTheme || 'system'
    this.updatePreview(themeOptions, selectedTheme)
    const conf = (await Storage.getConfig()) || {}
    conf.themeOptions = themeOptions
    await Storage.setConfig(conf)
  }

  render() {
    const { theme } = this.state
    if (!theme) {
      return null
    }
    const palette = ['blue', 'cyan', 'coolGray', 'green', 'magenta', 'purple', 'red', 'teal']
    const fontSizes = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    return (
      <ThemeContext.Provider value={theme}>
        <MainContext.Provider value={{ ...(this.context as any), theme }}>
          <PaperProvider theme={theme}>
            <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
              <StatusBar
                backgroundColor={theme.colors.background}
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
              />
              <ScrollView style={{ backgroundColor: theme.colors.background }}>
          <View style={{ height: theme.metrics.blocks.rowDiscussion + 33 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: '33.333%' }}>
                <SectionHeaderComponent title={t('profile.theme')} backgroundColor={theme.colors.surface} />
                <FormRowSelectComponent
                  value={t(`profile.${this.state.selectedTheme}`)}
                  onSelect={t => this.setSelectedTheme(t)}
                  options={[
                    { value: 'system', label: t('profile.system') },
                    { value: 'dark', label: t('profile.dark') },
                    { value: 'light', label: t('profile.light') },
                  ]}
                  width={theme.metrics.screen.width / 3}
                />
              </View>
              <View style={{ width: '33.333%' }}>
                <SectionHeaderComponent title={t('profile.fontSize')} backgroundColor={theme.colors.surface} />
                <FormRowSelectComponent
                  value={`${this.state && this.state.themeOptions && this.state.themeOptions.baseFontSize}`}
                  onSelect={size => this.setThemeOption('baseFontSize', Number(size))}
                  options={fontSizes.map(s => ({ value: `${s}` }))}
                  width={theme.metrics.screen.width / 3}
                />
              </View>
              <View style={{ width: '33.333%' }}>
                <SectionHeaderComponent title={t('profile.padding')} backgroundColor={theme.colors.surface} />
                <FormRowSelectComponent
                  value={`${this.state && this.state.themeOptions && this.state.themeOptions.baseBlockSize}`}
                  onSelect={size => this.setThemeOption('baseBlockSize', Number(size))}
                  options={fontSizes.map(s => ({ value: `${s}` }))}
                  width={theme.metrics.screen.width / 3}
                />
              </View>
            </View>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 33 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} A`} backgroundColor={theme.colors.primary} />
                <FormRowSelectComponent
                  value={`${this.state && this.state.themeOptions && this.state.themeOptions.primaryColor}`}
                  onSelect={c => this.setThemeOption('primaryColor', c)}
                  options={palette.map(c => ({ value: `${c}`, color: IBMColorPalette[`${c}60`] }))}
                  width={theme.metrics.screen.width / 5}
                />
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} B`} backgroundColor={theme.colors.secondary} />
                <FormRowSelectComponent
                  value={`${this.state && this.state.themeOptions && this.state.themeOptions.secondaryColor}`}
                  onSelect={c => this.setThemeOption('secondaryColor', c)}
                  options={palette.map(c => ({ value: `${c}`, color: IBMColorPalette[`${c}60`] }))}
                  width={theme.metrics.screen.width / 5}
                />
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} C`} backgroundColor={theme.colors.tertiary} />
                <FormRowSelectComponent
                  value={`${this.state && this.state.themeOptions && this.state.themeOptions.tertiaryColor}`}
                  onSelect={c => this.setThemeOption('tertiaryColor', c)}
                  options={palette.map(c => ({ value: `${c}`, color: IBMColorPalette[`${c}60`] }))}
                  width={theme.metrics.screen.width / 5}
                />
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} D`} backgroundColor={theme.colors.surface} />
                <FormRowSelectComponent
                  value={`${
                    (this.state && this.state.themeOptions && this.state.themeOptions.surfaceColor) || 'transparent'
                  }`}
                  onSelect={c => this.setThemeOption('surfaceColor', c === 'transparent' ? undefined : c)}
                  options={[
                    { value: 'transparent' },
                    { value: 'black', color: 'black' },
                    { value: 'white', color: 'gray' },
                    ...palette.map(c => ({ value: `${c}`, color: IBMColorPalette[`${c}60`] })),
                  ]}
                  width={theme.metrics.screen.width / 5}
                />
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} E`} backgroundColor={theme.colors.surface} />
                <FormRowSelectComponent
                  value={`${
                    (this.state && this.state.themeOptions && this.state.themeOptions.backgroundColor) || 'default'
                  }`}
                  onSelect={c => this.setThemeOption('backgroundColor', c === 'default' ? undefined : c)}
                  options={[
                    { value: 'default' },
                    ...Object.keys(IBMColorPalette).map(c => ({
                      value: `${c}`,
                      color: c === 'white' ? 'gray' : IBMColorPalette[`${c}`],
                    })),
                  ]}
                  width={theme.metrics.screen.width / 5}
                />
              </View>
            </View>
          </View>
          <ComponentExamplesComponent nyx={this.nyx} />
        </ScrollView>
        <SafeBottom min={androidStackBottomInset}>
          {insetBottom => (
            <FAB
              style={{
                position: 'absolute',
                margin: 16,
                right: 0,
                bottom: insetBottom,
                backgroundColor: theme.colors.primary,
              }}
              icon={'export'}
              visible={true}
              onPress={() => this.exportTheme()}
            />
          )}
        </SafeBottom>
        <SafeBottom>
          {bottom =>
            bottom > 0 ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  bottom: -bottom,
                  left: 0,
                  right: 0,
                  height: bottom,
                  backgroundColor: theme.colors.background,
                }}
              />
            ) : null
          }
        </SafeBottom>
            </View>
          </PaperProvider>
        </MainContext.Provider>
      </ThemeContext.Provider>
    )
  }
}
