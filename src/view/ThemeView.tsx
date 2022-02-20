import React, { Component } from 'react'
import { ScrollView, ToastAndroid, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { FAB } from 'react-native-paper'
import { ComponentExamplesComponent, FormRowSelectComponent, SectionHeaderComponent } from '../component'
import {
  defaultThemeOptions,
  exportTheme,
  MainContext,
  Storage,
  t,
  Theme,
  IBMColorPalette,
  createTheme,
  Nyx,
  ThemeOptions,
} from '../lib'

type Props = {
  config: any
  onConfigChange: Function
}
type State = {
  theme: Theme
  themeOptions: ThemeOptions
  selectedTheme: string
}
export class ThemeView extends Component<Props> {
  static contextType = MainContext
  nyx?: Nyx
  state: Readonly<Partial<State>> = {}
  constructor(props) {
    super(props)
    this.loadSettings()
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.setTheme()
  }

  // componentWillUnmount() {
  //   this.props.onConfigChange()
  // }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  previewTheme() {
    const params = this.state && this.state.themeOptions ? this.state.themeOptions : { ...defaultThemeOptions }
    const theme = createTheme(params)
    this.setState({ theme })
  }

  exportTheme() {
    const data = { ...this.state.themeOptions }
    Clipboard.setString(exportTheme(data))
    // Clipboard.setString(`nnn://theme::${encodeURIComponent(JSON.stringify(data))}`)
    ToastAndroid.showWithGravity(t('coppied'), ToastAndroid.LONG, ToastAndroid.BOTTOM)
  }

  async loadSettings() {
    let { config } = this.props
    if (!config) {
      config = await Storage.getConfig()
    }
    this.state = {
      themeOptions: config?.themeOptions || { ...defaultThemeOptions },
      selectedTheme: config?.theme || 'system',
    }
  }

  async setSelectedTheme(theme: string) {
    const conf = await Storage.getConfig()
    this.setState({ selectedTheme: theme })
    conf.theme = theme
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  async setThemeOption(key, val) {
    const conf = await Storage.getConfig()
    const themeOptions = this.state && this.state.themeOptions ? this.state.themeOptions : { ...defaultThemeOptions }
    themeOptions[key] = val
    this.setState({ themeOptions })
    conf.themeOptions = themeOptions
    await Storage.setConfig(conf)
    // this.previewTheme()
    this.props.onConfigChange()
  }

  render() {
    const { theme } = this.state
    if (!theme) {
      return null
    }
    const palette = ['blue', 'cyan', 'coolGray', 'green', 'magenta', 'purple', 'red', 'teal']
    const fontSizes = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
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
        <FAB
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.primary,
          }}
          icon={'export'}
          visible={true}
          onPress={() => this.exportTheme()}
        />
      </View>
    )
  }
}
