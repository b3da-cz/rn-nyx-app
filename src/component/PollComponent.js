import React, { useState } from 'react'
import { View } from 'react-native'
import { Text, ProgressBar } from 'react-native-paper'
import { ButtonComponent, UserRowComponent } from '../component'
import { Styling } from '../lib'

export const PollComponent = ({
  isDarkMode,
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
  const [selected, setSelected] = useState([])
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
    <View style={Styling.groups.borderWithoutTop}>
      <Text
        style={{
          padding: Styling.metrics.block.medium,
          fontSize: Styling.metrics.fontSize.large,
          color: Styling.colors.secondary,
        }}>
        {label}
      </Text>
      <Text
        style={{
          paddingHorizontal: Styling.metrics.block.medium,
          paddingBottom: Styling.metrics.block.medium,
          fontSize: Styling.metrics.fontSize.medium,
          color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
        }}>
        {`${instructions ? instructions : ''}`}
        {`${totalVotes > 0 ? `\n\n${totalVotes} votes` : ''}`}
        {`${totalRespondents > 0 ? `\n${totalRespondents} respondents` : ''}`}
      </Text>
      {votes?.length > 0 &&
        votes.map(r => (
          <UserRowComponent
            key={r.user.username}
            user={r.user}
            isDarkMode={isDarkMode}
            isPressable={false}
            extraText={r.answer}
          />
        ))}
      {answers &&
        Object.keys(answers).length > 0 &&
        Object.keys(answers).map(key => (
          <View key={key}>
            <ButtonComponent
              isDisabled={!canVote}
              label={answers[key].answer}
              textAlign={'left'}
              borderWidth={1}
              borderColor={selected.includes(key) ? Styling.colors.secondary : Styling.colors.black}
              backgroundColor={selected.includes(key) ? Styling.colors.darker : Styling.colors.black}
              color={Styling.colors.secondary}
              fontSize={Styling.metrics.fontSize.medium}
              marginTop={answers[key].result ? 0 : Styling.metrics.block.small}
              marginBottom={0}
              isDarkMode={isDarkMode}
              onPress={() => onAnswer(key)}
            />
            {!!answers[key].result && (
              <ProgressBar
                progress={answers[key].result.respondents_count / (totalVotes / 100) / 100}
                color={answers[key].result.is_my_vote ? Styling.colors.primary : Styling.colors.darker}
                // style={{ height: 10 }}
              />
            )}
          </View>
        ))}
      {canVote && (
        <ButtonComponent
          label={`Vote! [ max ${allowedAnswers} answer${allowedAnswers > 1 ? 's' : ''} ]`}
          icon={'x-square'}
          textAlign={'center'}
          borderWidth={1}
          backgroundColor={isDarkMode ? Styling.colors.black : Styling.colors.white}
          color={Styling.colors.secondary}
          fontSize={Styling.metrics.fontSize.large}
          marginTop={Styling.metrics.block.medium}
          isDarkMode={isDarkMode}
          onPress={() => onVote(selected)}
        />
      )}
    </View>
  )
}
