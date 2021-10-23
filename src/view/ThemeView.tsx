import React, { Component } from 'react'
import { ScrollView, ToastAndroid, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { FAB } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'
import { ComponentExamplesComponent, SectionHeaderComponent } from '../component'
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
          <View style={{ height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: '33.333%' }}>
                <SectionHeaderComponent title={t('profile.theme')} backgroundColor={theme.colors.surface} />
                <Picker
                  mode={'dropdown'}
                  prompt={t('profile.theme')}
                  selectedValue={this.state.selectedTheme}
                  onValueChange={t => this.setSelectedTheme(t)}>
                  <Picker.Item
                    key={'system'}
                    label={t('profile.system')}
                    value={'system'}
                    color={theme.colors.link}
                    style={{ fontSize: theme.metrics.fontSizes.p }}
                  />
                  <Picker.Item
                    key={'dark'}
                    label={t('profile.dark')}
                    value={'dark'}
                    color={theme.colors.link}
                    style={{ fontSize: theme.metrics.fontSizes.p }}
                  />
                  <Picker.Item
                    key={'light'}
                    label={t('profile.light')}
                    value={'light'}
                    color={theme.colors.link}
                    style={{ fontSize: theme.metrics.fontSizes.p }}
                  />
                </Picker>
              </View>
              <View style={{ width: '33.333%' }}>
                <SectionHeaderComponent title={t('profile.fontSize')} backgroundColor={theme.colors.surface} />
                <Picker
                  mode={'dropdown'}
                  prompt={t('profile.fontSize')}
                  selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.baseFontSize}
                  onValueChange={size => this.setThemeOption('baseFontSize', size)}>
                  {fontSizes.map(size => (
                    <Picker.Item
                      key={`${size}-fontSize`}
                      label={`${size}`}
                      value={size}
                      color={theme.colors.link}
                      style={{ fontSize: theme.metrics.fontSizes.p }}
                    />
                  ))}
                </Picker>
              </View>
              <View style={{ width: '33.333%' }}>
                <SectionHeaderComponent title={t('profile.padding')} backgroundColor={theme.colors.surface} />
                <Picker
                  mode={'dropdown'}
                  prompt={t('profile.padding')}
                  selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.baseBlockSize}
                  onValueChange={size => this.setThemeOption('baseBlockSize', size)}>
                  {fontSizes.map(size => (
                    <Picker.Item
                      key={`${size}-padding`}
                      label={`${size}`}
                      value={size}
                      color={theme.colors.link}
                      style={{ fontSize: theme.metrics.fontSizes.p }}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} A`} backgroundColor={theme.colors.primary} />
                <Picker
                  mode={'dropdown'}
                  prompt={`${t('profile.color')} A`}
                  dropdownIconColor={theme.colors.primary}
                  selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.primaryColor}
                  onValueChange={color => this.setThemeOption('primaryColor', color)}>
                  {palette.map(color => (
                    <Picker.Item
                      key={`${color}-a`}
                      label={color}
                      value={color}
                      color={IBMColorPalette[`${color}60`]}
                      style={{ fontSize: theme.metrics.fontSizes.p }}
                    />
                  ))}
                </Picker>
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} B`} backgroundColor={theme.colors.secondary} />
                <Picker
                  mode={'dropdown'}
                  prompt={`${t('profile.color')} B`}
                  dropdownIconColor={theme.colors.secondary}
                  selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.secondaryColor}
                  onValueChange={color => this.setThemeOption('secondaryColor', color)}>
                  {palette.map(color => (
                    <Picker.Item
                      key={`${color}-b`}
                      label={color}
                      value={color}
                      color={IBMColorPalette[`${color}60`]}
                      style={{ fontSize: theme.metrics.fontSizes.p }}
                    />
                  ))}
                </Picker>
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} C`} backgroundColor={theme.colors.tertiary} />
                <Picker
                  mode={'dropdown'}
                  prompt={`${t('profile.color')} C`}
                  dropdownIconColor={theme.colors.tertiary}
                  selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.tertiaryColor}
                  onValueChange={color => this.setThemeOption('tertiaryColor', color)}>
                  {palette.map(color => (
                    <Picker.Item
                      key={`${color}-c`}
                      label={color}
                      value={color}
                      color={IBMColorPalette[`${color}60`]}
                      style={{ fontSize: theme.metrics.fontSizes.p }}
                    />
                  ))}
                </Picker>
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} D`} backgroundColor={theme.colors.surface} />
                <Picker
                  mode={'dropdown'}
                  prompt={`${t('profile.color')} D`}
                  dropdownIconColor={theme.colors.text}
                  selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.surfaceColor}
                  onValueChange={color => this.setThemeOption('surfaceColor', color)}>
                  <Picker.Item
                    key={'transparent-d'}
                    label={'transparent'}
                    value={undefined}
                    color={theme.colors.text}
                    style={{ fontSize: theme.metrics.fontSizes.p }}
                  />
                  <Picker.Item
                    key={'black-d'}
                    label={'black'}
                    value={'black'}
                    color={theme.colors.text}
                    style={{ fontSize: theme.metrics.fontSizes.p }}
                  />
                  <Picker.Item
                    key={'white-d'}
                    label={'white'}
                    value={'white'}
                    color={theme.colors.text}
                    style={{ fontSize: theme.metrics.fontSizes.p }}
                  />
                  {palette.map(color => (
                    <Picker.Item
                      key={`${color}-d`}
                      label={color}
                      value={color}
                      color={IBMColorPalette[`${color}60`]}
                      style={{ fontSize: theme.metrics.fontSizes.p }}
                    />
                  ))}
                </Picker>
              </View>
              <View style={{ width: '20%' }}>
                <SectionHeaderComponent title={`${t('profile.color')} E`} backgroundColor={theme.colors.surface} />
                <Picker
                  mode={'dropdown'}
                  prompt={`${t('profile.color')} E`}
                  dropdownIconColor={theme.colors.text}
                  selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.backgroundColor}
                  onValueChange={color => this.setThemeOption('backgroundColor', color)}>
                  <Picker.Item
                    key={'default-e'}
                    label={'default'}
                    value={undefined}
                    color={theme.colors.text}
                    style={{ fontSize: theme.metrics.fontSizes.p }}
                  />
                  {Object.keys(IBMColorPalette).map(color => (
                    <Picker.Item
                      key={`${color}-e`}
                      label={color}
                      value={color}
                      color={
                        this.state?.themeOptions?.backgroundColor === color ? theme.colors.text : IBMColorPalette[color]
                      }
                      style={{ fontSize: theme.metrics.fontSizes.p }}
                    />
                  ))}
                </Picker>
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
