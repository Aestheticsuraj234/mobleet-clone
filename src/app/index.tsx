import { UserMenu } from '@/components/user-menu'
import useBearStore from '@/state'
import { Button, ScrollView, StyleSheet, Text } from 'react-native'

export default function Index() {
  const bears = useBearStore(({ bears }) => bears)
  const { increasePopulation } = useBearStore()

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <UserMenu />
      <Text style={styles.heading}>Total sightings: {bears}</Text>
      <Button title="Increase population" onPress={() => increasePopulation()} />
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
  },
})
