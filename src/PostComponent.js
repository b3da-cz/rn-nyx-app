import React, { Component } from 'react'
import { Alert, Text, TouchableOpacity, Image, Modal, View } from 'react-native'
import Swipeable from 'react-native-swipeable-row';
import { generateUuidV4, getIsoStringWithTimezoneOffset, Nyx, Styling } from './'
import AutoHeightWebView from 'react-native-autoheight-webview'
import YoutubePlayer from 'react-native-youtube-iframe'
import Icon from 'react-native-vector-icons/Feather'
import { parse } from 'node-html-parser'

type Props = {
  post: Object,
  isDarkMode: boolean,
  nyx: Nyx,
  onDiscussionDetailShow: Function,
  onLayout: Function,
  onImages: Function,
  onDelete: Function,
}
export class PostComponent extends Component<Props> {
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      ratings: {},
    }
    this.swipeableRefs = {}
  }

  async getRating(post) {
    if (this.state.ratings[post.id]) {
      return // todo
    }
    const res = await this.props.nyx.getRating(post);
    const ratings = { ...this.state.ratings }
    ratings[post.id] = res
    this.setState({ ratings })
    // console.warn(res); // TODO: remove
    // console.warn(post); // TODO: remove
    // if (this.swipeableRefs[post.id]) {
    //   this.swipeableRefs[post.id].recenter()
    // }
  }

  async castVote(post, vote) {
    // await this.props.nyx.castVote(post, vote > 0 ? 'positive' : 'negative') // todo
    if (this.swipeableRefs[post.id]) {
      this.swipeableRefs[post.id].recenter()
    }
  }

  async deletePost(post) {
    Alert.alert('Warning', 'Delete post?', [
      {
        text: 'Cancel',
        onPress: () => null,
        style: 'cancel',
      },
      { text: 'OK', onPress: async () => {
          await this.props.nyx.deletePost(post.discussion_id, post.id)
          if (this.swipeableRefs[post.id]) {
            this.swipeableRefs[post.id].recenter()
          }
          this.props.onDelete(post.id)
        }},
    ])
  }

  formatDate(str) {
    const d = new Date(str)
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}  ${str.substring(11)}`
  }

  render() {
    const { post } = this.props

    // const rawLinks = post.content.match(/<a [^>]+>(.*?)<\/a>/g)
    // const rawImages = post.content.match(/<img[^>]*>/)
    // const regexImgSrc = /<img[^>]+src='(https:\/\/[^'>]+)'/g
    // const regexThumbSrc = /<img[^>]+data-thumb='(https:\/\/[^'>]+)'/g
    // const regexReplyHref = /<a[^>]+href='(\/[^'>]+)'/g
    // const links =
    //   rawLinks && rawLinks.length
    //     ? rawLinks.map(l => {
    //       try {
    //         return ({
    //           id: generateUuidV4(),
    //           raw: l,
    //           text: l.replace(/<[^>]*>?/gm, ''),
    //           reply: l.includes('class=r') ? regexReplyHref.exec(l)[1] : null,
    //         })
    //       } catch (e) {
    //         console.warn(e)
    //         return {id: generateUuidV4(), raw: l, reply: l}
    //       }
    //     })
    //     : []
    // const images =
    //   rawImages && rawImages.length
    //     ? rawImages.map(i => ({
    //         id: generateUuidV4(),
    //         raw: i,
    //         src: regexImgSrc.exec(i)[1],
    //         thumb: regexThumbSrc.exec(i)[1],
    //       }))
    //     : []

    const html = parse(`<div>${post.content}</div>`)
    // console.log(html.firstChild.structure)
    const replies = html.querySelectorAll('a[data-discussion-id]').map(a => ({
      id: generateUuidV4(),
      raw: a.toString(),
      text: a.innerText,
      discussionId: a.getAttribute('data-discussion-id'),
      postId: a.getAttribute('data-id'),
    }))
    // const links = html.querySelectorAll('a').map(a => ({
    //   id: generateUuidV4(),
    //   raw: a.toString(),
    //   text: a.innerText,
    //   discussionId: a.getAttribute('data-discussion-id'),
    //   postId: a.getAttribute('data-id'),
    // }))
    const images = html.querySelectorAll('img').map(i => ({
      id: generateUuidV4(),
      raw: i.toString(),
      src: i.getAttribute('src'),
      thumb: i.getAttribute('data-thumb'),
    }))
    const codeBlocks = html.querySelectorAll('pre').map(p => ({
      id: generateUuidV4(),
      raw: p.toString(),
    }))
    // const ytBlocks = html.querySelectorAll('div.embed-wrapper')
    const ytBlocks = html.querySelectorAll('a')
      .filter(a => a.getAttribute('href').includes('youtube') || a.getAttribute('href').includes('youtu.be'))
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        text: a.innerText,
        videoId: a.getAttribute('href').includes('youtube') ? a.getAttribute('href').replace('https://www.youtube.com/watch?v=', '') : a.getAttribute('href').replace('https://youtu.be/', ''),
      }))
    const ytBlocksToDelete = html.querySelectorAll('div.embed-wrapper')
      .map(a => ({
        id: generateUuidV4(),
        raw: a.toString(),
        videoId: a.getAttribute('data-embeded-type'),
      }))
    // console.log({replies, images})

    let content = post.content
    replies.forEach(l => (content = content.split(l.raw).join(`//######//###L#${l.id}//######//`)))
    images.forEach(i => (content = content.split(i.raw).join(`//######//###I#${i.id}//######//`)))
    codeBlocks.forEach(c => (content = content.split(c.raw).join(`//######//###C#${c.id}//######//`)))
    ytBlocks.forEach(y => (content = content.split(y.raw).join(`//######//###Y#${y.id}//######//`)))
    ytBlocksToDelete.forEach(y => (content = content.split(y.raw).join('AAA')))
    const contentParts = content.split('//######//')
    if (replies.length > 0 || images.length > 0 || codeBlocks.length > 0) {
      // console.log({replies, images, codeBlocks, content, contentParts}) // TODO: remove
    }
    let ratingH = 24 // 8*14 | 14*21 for 2 rows
    let ratingW = 16
    if (this.state.ratings[post.id] && this.state.ratings[post.id].length > 0 && this.state.ratings[post.id].length <= 10) {
      // ratingH = 40
      // ratingW = 30
    } else if (this.state.ratings[post.id] && this.state.ratings[post.id].length > 10 && this.state.ratings[post.id].length <= 36) {
      ratingH = 24
      ratingW = 16
    } else if (this.state.ratings[post.id] && this.state.ratings[post.id].length > 36) {
      ratingH = 16
      ratingW = 9
    }
    return (
      // <TouchableOpacity
      //   // key={post.id}
      //   accessibilityRole="button"
      //   onPress={() => console.warn(post)}
      //   onLayout={event => {
      //     const layout = event.nativeEvent.layout
      //     this.props.onLayout(post.id, layout.y)
      //   }}>
      <View
        onLayout={event => {
          // console.warn(event.nativeEvent.layout); // TODO: remove
          const layout = event.nativeEvent.layout
          this.props.onLayout(post.id, layout.y) // layout y always 0 in component
        }}>
        <Swipeable
          leftButtons={[
            !post.can_be_deleted ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => this.castVote(post, 1)}
                style={[Styling.groups.squareBtn, { backgroundColor: 'green' }]}>
                <Icon name="plus" size={24} color="#ccc" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => this.deletePost(post)}
                style={[Styling.groups.squareBtn]}>
                <Icon name="trash-2" size={24} color="#ccc" />
              </TouchableOpacity>
            ),
            !post.can_be_deleted ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => this.castVote(post, -1)}
                style={[Styling.groups.squareBtn]}>
                <Icon name="minus" size={24} color="#ccc" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 5, height: 50 }} />
            ),
          ]}
          leftButtonContainerStyle={{ alignItems: 'flex-end' }}
          leftButtonWidth={post.can_be_deleted ? 25 : 50}
          rightButtonWidth={300}
          rightButtons={
            this.state.ratings[post.id] && this.state.ratings[post.id].length > 0
              ? [
                  <View
                    style={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      flexWrap: 'wrap',
                    }}>
                    {this.state.ratings[post.id].map(r => (
                      <View
                        style={{
                          maxWidth: ratingW,
                          maxHeight: ratingH,
                          marginRight: 3,
                          borderColor: 'red',
                          borderWidth: 0,
                        }}>
                        {/*<Text style={{ color: r.tag === 'positive' ? Styling.colors.lighter : 'red', fontSize: 7 }}>{r.username}</Text>*/}
                        <Image
                          style={{ width: ratingW, height: ratingH }}
                          resizeMethod={'scale'}
                          resizeMode={'center'}
                          source={{ uri: `https://nyx.cz/${r.username[0]}/${r.username}.gif` }}
                        />
                      </View>
                    ))}
                  </View>,
                  // <View style={{flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', flexWrap: 'wrap'}}>
                  //   {this.state.ratings[post.id].map(r => (
                  //     <View style={{ maxWidth: 75, maxHeight: 10, marginRight: 3 }}>
                  //       <Text style={{ color: r.tag === 'positive' ? Styling.colors.lighter : 'red', fontSize: 7 }}>{r.username}</Text>
                  //     </View>
                  //   ))}
                  // </View>,
                ]
              : [<Text style={{ lineHeight: 38, color: Styling.colors.lighter }}>pull to get ratings</Text>]
          }
          onRightButtonsActivate={() => this.getRating(post)}
          rightButtonContainerStyle={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
          }}
          onRef={r => (this.swipeableRefs[post.id] = r)}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 5,
              paddingBottom: 5,
              paddingTop: 5,
              borderColor: Styling.colors.primary,
              borderBottomWidth: post.new ? 1 : 0,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', width: '80%' }}>
              <Image
                style={{ width: 30, height: 40, marginRight: 10, borderWidth: 1, borderColor: Styling.colors.lighter }}
                resizeMethod={'scale'}
                resizeMode={'center'}
                source={{ uri: `https://nyx.cz/${post.username[0]}/${post.username}.gif` }}
              />
              <View>
                <Text style={Styling.groups.link()} numberOfLines={1}>
                  {post.username}{' '}
                  <Text style={{ color: Styling.colors.dark, fontSize: 12 }}>
                    {post.activity &&
                      `[${post.activity.last_activity.substr(11)}|${post.activity.last_access_method[0]}] ${
                        post.activity.location
                      }`}
                  </Text>
                </Text>
                <Text style={{ color: Styling.colors.lighter, fontSize: 10 }}>{this.formatDate(post.inserted_at)}</Text>
              </View>
            </View>
            <Text
              style={[
                {
                  width: '10%',
                  color:
                    post.my_rating === 'positive'
                      ? 'green'
                      : post.my_rating === 'negative'
                      ? 'red'
                      : Styling.colors.lighter,
                  textAlign: 'right',
                },
              ]}>
              {post.rating}
            </Text>
          </View>
        </Swipeable>
        {/*<WebView*/}
        {/*  style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}*/}
        {/*  originWhitelist={['*']}*/}
        {/*  source={{ html: p.content }}*/}
        {/*/>*/}
        {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{JSON.stringify(p.content.match(/<a [^>]+>(.*?)<\/a>/g))}</Text>*/}
        {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{JSON.stringify(p.content.match(/<img[^>]*>/))}</Text>*/}

        {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{content}</Text>*/}

        <View style={[Styling.groups.themeComponent(this.props.isDarkMode), { paddingBottom: 5, borderWidth: 0, borderColor: 'red' }]}>
          {contentParts &&
            contentParts.length > 0 &&
            contentParts.map(part => {
              if (part.startsWith('###L#')) {
                const link = replies.filter(l => l.id === part.replace('###L#', ''))[0]
                // const linkWithParams = `${link.discussionId}?order=older_than&from_id=${(Number(link.postId) + 1)}`
                return (
                  <TouchableOpacity
                    // style={{borderWidth: 1, borderColor: 'blue'}}
                    accessibilityRole="button"
                    onPress={() => (link ? this.props.onDiscussionDetailShow(link.discussionId, link.postId) : null)}>
                    <Text
                      style={[
                        Styling.groups.description,
                        Styling.groups.themeComponent(this.props.isDarkMode),
                        { color: Styling.colors.primary, fontSize: 16, margin: 0, paddingVertical: 5 },
                      ]}>
                      @{link.text}
                    </Text>
                  </TouchableOpacity>
                )
              } else if (part.startsWith('###I#')) {
                const img = images.filter(i => i.id === part.replace('###I#', ''))[0]
                if (!img.src.includes('/images/play') && !img.src.includes('img.youtube.com')) {
                  let imgIndex = 0
                  images.forEach((im, i) => {
                    // meh meh meh todo
                    if (im.src === img.src) {
                      imgIndex = i
                    }
                  })
                  let w = Math.min(Styling.metrics.screen.width, Styling.metrics.screen.height) - 10
                  let h = Math.min(Styling.metrics.screen.width, Styling.metrics.screen.height) - 10
                  return (
                    <TouchableOpacity
                      // style={{borderWidth: 1, borderColor: 'green'}}
                      accessibilityRole="button"
                      onPress={() =>
                        this.props.onImages(
                          images.map(i => ({ url: i.src })),
                          imgIndex,
                        )
                      }>
                      <Image
                        style={{
                          width: w,
                          height: h / 2.5,
                          margin: 5,
                          backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
                        }}
                        resizeMethod={'scale'}
                        resizeMode={'center'}
                        source={{ uri: img.src }}
                      />
                    </TouchableOpacity>
                  )
                }
              } else if (part.startsWith('###C#')) {
                const codeBlock = codeBlocks.filter(c => c.id === part.replace('###C#', ''))[0]
                return (
                  <View>
                    <AutoHeightWebView
                      style={{ width: Styling.metrics.screen.width - 10, marginHorizontal: 5 }}
                      // customScript={`document.body.style.background = 'lightyellow';`}
                      customStyle={`
                      pre {
                        font-size: 10px;
                      }
                    `}
                      // onSizeUpdated={size => console.log(size.height)}
                      // files={[{
                      //   href: 'cssfileaddress',
                      //   type: 'text/css',
                      //   rel: 'stylesheet'
                      // }]}
                      source={{ html: codeBlock.raw }}
                      scalesPageToFit={false}
                      viewportContent={'width=device-width, user-scalable=no'}
                      /*
                    other react-native-webview props
                    */
                    />
                    {/*<WebView*/}
                    {/*  style={[{flex: 1, width: '100%', overflowY: 'auto'}, Styling.groups.themeComponent(this.props.isDarkMode)]}*/}
                    {/*  containerStyle={{width: Styling.metrics.screen.width - 10, height: Styling.metrics.screen.width, margin: 5, overflowY: 'auto'}}*/}
                    {/*  originWhitelist={['*']}*/}
                    {/*  source={{ html: codeBlock.raw }}*/}
                    {/*/>*/}
                  </View>
                )
              } else if (part.startsWith('###Y#')) {
                const ytBlock = ytBlocks.filter(c => c.id === part.replace('###Y#', ''))[0]
                // console.warn(post, contentParts); // TODO: remove
                return (
                  <View>
                    <YoutubePlayer
                      height={Styling.metrics.window.width / 1.777}
                      // play={playing}
                      videoId={ytBlock.videoId}
                      // onChangeState={onStateChange}
                      // style={{marginBottom: -200}}
                    />
                  </View>
                )
              } else if (!part || (part && part.length === 0)) {
                return null
              } else {
                return (
                  <Text
                    style={[
                      Styling.groups.description,
                      Styling.groups.themeComponent(this.props.isDarkMode),
                      { fontSize: 16, paddingVertical: 2 },
                    ]}>
                    {part
                      .split('<br>')
                      .join('\r\n')
                      .split('<br />')
                      .join('\r\n')
                      .replace(/(<([^>]+)>)/gi, '')}
                  </Text>
                )
              }
            })}
        </View>
        {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{content}</Text>*/}
        {/*{images && images.length > 0 && images.map(i => (<Image*/}
        {/*  style={{width: (Styling.metrics.screen.width - 10), height: (Styling.metrics.screen.width - 10), margin: 5, backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white}}*/}
        {/*  resizeMethod={'scale'}*/}
        {/*  resizeMode={'center'}*/}
        {/*  source={{uri: i.src}}*/}
        {/*/>))}*/}
        {/*</TouchableOpacity>*/}
      </View>
    );
  }

  // just regexes...
  // render() {
  //   const { post } = this.props
  //   const rawLinks = post.content.match(/<a [^>]+>(.*?)<\/a>/g)
  //   const rawImages = post.content.match(/<img[^>]*>/)
  //   const regexImgSrc = /<img[^>]+src='(https:\/\/[^'>]+)'/g
  //   const regexThumbSrc = /<img[^>]+data-thumb='(https:\/\/[^'>]+)'/g
  //   const regexReplyHref = /<a[^>]+href='(\/[^'>]+)'/g
  //   const links =
  //     rawLinks && rawLinks.length
  //       ? rawLinks.map(l => {
  //         try {
  //           return ({
  //             id: generateUuidV4(),
  //             raw: l,
  //             text: l.replace(/<[^>]*>?/gm, ''),
  //             reply: l.includes('class=r') ? regexReplyHref.exec(l)[1] : null,
  //           })
  //         } catch (e) {
  //           console.warn(e)
  //           return {id: generateUuidV4(), raw: l, reply: l}
  //         }
  //       })
  //       : []
  //   const images =
  //     rawImages && rawImages.length
  //       ? rawImages.map(i => ({
  //           id: generateUuidV4(),
  //           raw: i,
  //           src: regexImgSrc.exec(i)[1],
  //           thumb: regexThumbSrc.exec(i)[1],
  //         }))
  //       : []
  //   let content = post.content
  //   links.forEach(l => (content = content.replaceAll(l.raw, `//######//###L#${l.id}//######//`)))
  //   images.forEach(i => (content = content.replaceAll(i.raw, `//######//###I#${i.id}//######//`)))
  //   const contentParts = content.split('//######//')
  //   if (links.length > 0 || images.length > 0) {
  //     // console.log({links, images, content, contentParts}) // TODO: remove
  //   }
  //   return (
  //     <TouchableOpacity
  //       // key={post.id}
  //       accessibilityRole="button"
  //       onPress={() => console.warn(post)}
  //       onLayout={event => {
  //         const layout = event.nativeEvent.layout
  //         this.props.onLayout(post.id, layout.y)
  //       }}>
  //       <Text style={Styling.groups.link()}>{post.username}</Text>
  //       {/*<WebView*/}
  //       {/*  style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}*/}
  //       {/*  originWhitelist={['*']}*/}
  //       {/*  source={{ html: p.content }}*/}
  //       {/*/>*/}
  //       {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{JSON.stringify(p.content.match(/<a [^>]+>(.*?)<\/a>/g))}</Text>*/}
  //       {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{JSON.stringify(p.content.match(/<img[^>]*>/))}</Text>*/}
  //
  //       {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{content}</Text>*/}
  //       {contentParts &&
  //         contentParts.length > 0 &&
  //         contentParts.map(part => {
  //           if (part.startsWith('###L#')) {
  //             const link = links.filter(l => l.id === part.replace('###L#', ''))[0]
  //             // const linkWithParams = link.reply.replace('/discussion/', '').split('/id/').join('?order=older_than&from_id=') // wtf nyx!!@@??!
  //             // const linkWithParams = link.reply.replace('/discussion/', '').split('/id/')[0] + '?order=newer_than&from_id=' + (Number(link.reply.replace('/discussion/', '').split('/id/')[1]) - 1) // wtf nyx!!@@??!
  //             const linkWithParams =
  //               link && link.reply
  //                 ? link.reply.replace('/discussion/', '').split('/id/')[0] +
  //                   '?order=older_than&from_id=' +
  //                   (Number(link.reply.replace('/discussion/', '').split('/id/')[1]) + 1)
  //                 : null // wtf nyx!!@@??!
  //             return (
  //               <TouchableOpacity
  //                 accessibilityRole="button"
  //                 onPress={() => (linkWithParams ? this.props.onDiscussionDetailShow(linkWithParams) : null)}>
  //                 <Text
  //                   style={[
  //                     Styling.groups.description,
  //                     Styling.groups.themeComponent(this.props.isDarkMode),
  //                     { color: Styling.colors.primary },
  //                   ]}>
  //                   {link.text}
  //                 </Text>
  //               </TouchableOpacity>
  //             )
  //           } else if (part.startsWith('###I#')) {
  //             const img = images.filter(i => i.id === part.replace('###I#', ''))[0]
  //             return (
  //               <Image
  //                 style={{
  //                   width: Styling.metrics.screen.width - 10,
  //                   height: Styling.metrics.screen.width - 10,
  //                   margin: 5,
  //                   backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
  //                 }}
  //                 resizeMethod={'scale'}
  //                 resizeMode={'center'}
  //                 source={{ uri: img.src }}
  //               />
  //             )
  //           } else if (!part || (part && part.length === 0)) {
  //             return null
  //           } else {
  //             return (
  //               <Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>
  //                 {part && typeof part.replaceAll === 'function' && part.replaceAll('<br>', '\r\n').replaceAll('<br />', '\r\n')}
  //               </Text>
  //             )
  //           }
  //         })}
  //
  //       {/*<Text style={[Styling.groups.description, Styling.groups.themeComponent(this.props.isDarkMode)]}>{content}</Text>*/}
  //       {/*{images && images.length > 0 && images.map(i => (<Image*/}
  //       {/*  style={{width: (Styling.metrics.screen.width - 10), height: (Styling.metrics.screen.width - 10), margin: 5, backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white}}*/}
  //       {/*  resizeMethod={'scale'}*/}
  //       {/*  resizeMode={'center'}*/}
  //       {/*  source={{uri: i.src}}*/}
  //       {/*/>))}*/}
  //     </TouchableOpacity>
  //   )
  // }
}
