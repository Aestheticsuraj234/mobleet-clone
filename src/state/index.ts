import { create } from "zustand";

interface BearStore {
    bears: number;
    increasePopulation(): void;
}


const useBearStore = create<BearStore>((set) => ({
    bears: 0,
    increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));


export default useBearStore;
