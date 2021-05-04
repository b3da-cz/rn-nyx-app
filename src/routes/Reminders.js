import React from 'react'
import { RemindersView } from '../view'

export const Reminders = ({ navigation, route }) => <RemindersView navigation={navigation} type={route.params?.type} />
