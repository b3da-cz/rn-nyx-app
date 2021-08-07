import React, { useState } from 'react'
import { View } from 'react-native'
import { Text, ProgressBar } from 'react-native-paper'
import { ButtonComponent, UserRowComponent } from '../component'
import { useTheme } from '../lib'

export const PollComponent = ({
  label,
  instructions,
  answers,
  allowedAnswers,
  totalRespondents,
  totalVotes,
  votes,
  canVote,
  onVote,
}) => {
  const [selected, setSelected] = useState<any[]>([])
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const onAnswer = key => {
    if (selected.includes(key)) {
      setSelected([...selected].filter(k => k !== key))
      return
    }
    if (selected.length < allowedAnswers) {
      setSelected([...selected, key])
    } else {
      setSelected([...selected.slice(selected.length + 1 - allowedAnswers), key])
    }
  }
  return (
    <View style={{ paddingHorizontal: blocks.medium }}>
      <Text
        style={{
          padding: blocks.large,
          fontSize: fontSizes.h3,
        }}>
        {label}
      </Text>
      <Text
        style={{
          paddingHorizontal: blocks.large,
          paddingBottom: blocks.large,
          fontSize: fontSizes.p,
        }}>
        {`${instructions ? instructions : ''}`}
        {`${totalVotes > 0 ? `\n\n${totalVotes} votes` : ''}`}
        {`${totalRespondents > 0 ? `\n${totalRespondents} respondents` : ''}`}
      </Text>
      {votes?.length > 0 &&
        votes.map(r => (
          <UserRowComponent key={r.user.username} user={r.user} isPressable={false} extraText={r.answer} />
        ))}
      {answers &&
        Object.keys(answers).length > 0 &&
        Object.keys(answers).map(key => (
          <View key={key}>
            <ButtonComponent
              isDisabled={!canVote}
              label={`${answers[key].answer}   ${answers[key].result?.respondents_count || ''}`}
              textAlign={'left'}
              borderWidth={1}
              borderColor={selected.includes(key) ? colors.accent : colors.background}
              // backgroundColor={selected.includes(key) ? colors.primary : colors.background}
              color={colors.accent}
              fontSize={fontSizes.p}
              marginTop={answers[key].result ? 0 : blocks.medium}
              marginBottom={0}
              onPress={() => onAnswer(key)}
            />
            {!!answers[key].result && (
              <ProgressBar
                progress={answers[key].result.respondents_count / (totalVotes / 100) / 100}
                color={answers[key].result.is_my_vote ? colors.accent : colors.primary}
                // style={{ height: 10 }}
              />
            )}
          </View>
        ))}
      {canVote && (
        <ButtonComponent
          isDisabled={!selected.length}
          label={`Vote! [ max ${allowedAnswers} answer${allowedAnswers > 1 ? 's' : ''} ]`}
          icon={'x-square'}
          textAlign={'center'}
          borderWidth={1}
          borderColor={selected.length ? colors.accent : colors.disabled}
          color={selected.length ? colors.accent : colors.disabled}
          fontSize={fontSizes.h3}
          marginTop={blocks.large}
          onPress={() => onVote(selected)}
        />
      )}
    </View>
  )
}
