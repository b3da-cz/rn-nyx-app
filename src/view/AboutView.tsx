import React, { Component } from 'react'
import { Linking, ScrollView, View } from 'react-native'
import { Text } from 'react-native-paper'
import { LinkComponent, SectionHeaderComponent, UserRowComponent } from '../component'
import { MainContext, Theme, Nyx } from '../lib'
import { testers, supporters } from '../../credits.json'

type Props = {
  navigation: any
}
type State = {
  theme: Theme
}
export class AboutView extends Component<Props> {
  static contextType = MainContext
  nyx?: Nyx
  state: Readonly<Partial<State>> = {}
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.setTheme()
  }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  render() {
    const { theme } = this.state
    if (!theme) {
      return null
    }
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <ScrollView style={{ backgroundColor: theme.colors.background }}>
          <SectionHeaderComponent title={'Nnn'} backgroundColor={theme.colors.surface} />
          <Text style={{ padding: 5 }}>
            Nnn je neoficiální mobilní klient pro diskuzní server Nyx.cz, psaný v JS/TS s použitím frameworku
            React-Native. Aktuálně je ve vývoji pouze verze pro Android. Aplikaci můžete nainstalovat z Google Play,
            případně zbuildit ze zdrojového kódu.
          </Text>
          <LinkComponent
            onPress={() =>
              Linking.openURL('https://play.google.com/store/apps/details?id=net.b3da.nnn').catch(() => null)
            }>
            Záznam v Google Play Store
          </LinkComponent>
          <LinkComponent onPress={() => Linking.openURL('https://github.com/b3da-cz/rn-nyx-app').catch(() => null)}>
            Zdrojový kód aplikace
          </LinkComponent>
          <LinkComponent onPress={() => Linking.openURL('https://www.npmjs.com/package/nyx-api').catch(() => null)}>
            Knihovna pro komunikaci s Nyx API
          </LinkComponent>
          {/*<LinkComponent onPress={() => Linking.openURL('https://nyx.cz/discussion/271373').catch(() => null)}>*/}
          <LinkComponent onPress={() => this.props.navigation.navigate('discussion', { discussionId: 271373 })}>
            Klub věnovaný vývoji
          </LinkComponent>
          <Text style={{ padding: 5 }}>
            {'Děkuji všem, kteří se podíleli na testování a ladění prvních vydání aplikace, zejména pak ID níže.' +
              '\nTaké bych rád poděkoval těm, kteří se rozhodli podpořit vývoj aplikace na buymeacoffee.'}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '50%' }}>
              <SectionHeaderComponent title={'Testeři'} backgroundColor={theme.colors.surface} />
              {testers.map(tester => (
                <UserRowComponent user={{ username: tester }} key={`tester-${tester}`} />
              ))}
            </View>
            <View style={{ width: '50%' }}>
              <SectionHeaderComponent
                title={'Podporovatelé'}
                backgroundColor={theme.colors.surface}
                // icon={'plus'}
                // isPressable={true} // todo gplay terms https://support.google.com/googleplay/android-developer/answer/9858738?hl=en
                // onPress={() => Linking.openURL('https://www.buymeacoffee.com/b3da').catch(() => null)}
              />
              {supporters.map(supporter => (
                <UserRowComponent user={{ username: supporter }} key={`supporter-${supporter}`} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }
}
