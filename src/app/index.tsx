import useBearStore from "@/state";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const bears = useBearStore(({ bears }) => bears);
  const { increasePopulation } = useBearStore();
  return (
    <View style={styles.container}>
        <Text style={styles.heading}>Total sightings: {bears}</Text>
        <Button title="Increase population" onPress={() => increasePopulation()} />
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
