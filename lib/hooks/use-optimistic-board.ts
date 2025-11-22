"use client";

import { useState, useCallback } from "react";
import { getBoardLists, updateList, deleteList, createList } from "@/lib/actions/lists";
import { getBoardCards, moveCard, updateCard, deleteCard, createCard } from "@/lib/actions/cards";
import type {
  List,
  CardWithDetails,
  CreateListInput,
  CreateCardInput,
  UpdateCardInput,
} from "@/lib/types/organization";

export function useOptimisticBoard(boardId: string) {
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<CardWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all board data
  const loadBoardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [listsResult, cardsResult] = await Promise.all([getBoardLists(boardId), getBoardCards(boardId)]);

      if (listsResult.success && listsResult.data) {
        setLists(listsResult.data);
      } else if (listsResult.error) {
        setError(listsResult.error);
      }

      if (cardsResult.success && cardsResult.data) {
        setCards(cardsResult.data as CardWithDetails[]);
      } else if (cardsResult.error) {
        setError(cardsResult.error);
      }
    } catch (err) {
      setError("Failed to load board data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  // Optimistic list operations
  const optimisticUpdateList = useCallback((listId: string, updates: Partial<List>) => {
    setLists((prev) => prev.map((list) => (list.id === listId ? { ...list, ...updates } : list)));
  }, []);

  const optimisticAddList = useCallback((newList: List) => {
    setLists((prev) => [...prev, newList]);
  }, []);

  const optimisticRemoveList = useCallback((listId: string) => {
    setLists((prev) => prev.filter((list) => list.id !== listId));
    // Also remove cards from that list
    setCards((prev) => prev.filter((card) => card.list_id !== listId));
  }, []);

  const optimisticReorderLists = useCallback((reorderedLists: List[]) => {
    setLists(reorderedLists);
  }, []);

  // Optimistic card operations
  const optimisticUpdateCard = useCallback((cardId: string, updates: Partial<CardWithDetails>) => {
    setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card)));
  }, []);

  const optimisticAddCard = useCallback((newCard: CardWithDetails) => {
    setCards((prev) => [...prev, newCard]);
  }, []);

  const optimisticRemoveCard = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  }, []);

  const optimisticMoveCard = useCallback((cardId: string, targetListId: string, targetPosition: number) => {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, list_id: targetListId, position: targetPosition } : card))
    );
  }, []);

  // Server operations with optimistic updates
  const updateListWithOptimism = useCallback(
    async (listId: string, updates: { title?: string; position?: number }) => {
      const prevLists = [...lists];
      optimisticUpdateList(listId, updates);

      try {
        const result = await updateList(listId, updates);
        if (!result.success) {
          setLists(prevLists);
          throw new Error(result.error || "Failed to update list");
        }
        return result;
      } catch (err) {
        setLists(prevLists);
        throw err;
      }
    },
    [lists, optimisticUpdateList]
  );

  const deleteListWithOptimism = useCallback(
    async (listId: string) => {
      const prevLists = [...lists];
      const prevCards = [...cards];
      optimisticRemoveList(listId);

      try {
        const result = await deleteList(listId);
        if (!result.success) {
          setLists(prevLists);
          setCards(prevCards);
          throw new Error(result.error || "Failed to delete list");
        }
        return result;
      } catch (err) {
        setLists(prevLists);
        setCards(prevCards);
        throw err;
      }
    },
    [lists, cards, optimisticRemoveList]
  );

  const createListWithOptimism = useCallback(
    async (input: CreateListInput) => {
      const tempId = `temp-${Date.now()}`;
      const tempList: List = {
        id: tempId,
        board_id: input.board_id,
        title: input.title,
        position: input.position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      optimisticAddList(tempList);

      try {
        const result = await createList(input);
        if (!result.success || !result.data) {
          setLists((prev) => prev.filter((l) => l.id !== tempId));
          throw new Error(result.error || "Failed to create list");
        }
        // Replace temp list with real one
        setLists((prev) => prev.map((l) => (l.id === tempId ? result.data! : l)));
        return result;
      } catch (err) {
        setLists((prev) => prev.filter((l) => l.id !== tempId));
        throw err;
      }
    },
    [optimisticAddList]
  );

  const moveCardWithOptimism = useCallback(
    async (cardId: string, targetListId: string, targetPosition: number) => {
      const prevCards = [...cards];
      optimisticMoveCard(cardId, targetListId, targetPosition);

      try {
        const result = await moveCard({
          card_id: cardId,
          target_list_id: targetListId,
          target_position: targetPosition,
        });

        if (!result.success) {
          setCards(prevCards);
          throw new Error(result.error || "Failed to move card");
        }
        return result;
      } catch (err) {
        setCards(prevCards);
        throw err;
      }
    },
    [cards, optimisticMoveCard]
  );

  const updateCardWithOptimism = useCallback(
    async (cardId: string, updates: UpdateCardInput) => {
      const prevCards = [...cards];
      optimisticUpdateCard(cardId, updates);

      try {
        const result = await updateCard(cardId, updates);
        if (!result.success) {
          setCards(prevCards);
          throw new Error(result.error || "Failed to update card");
        }
        return result;
      } catch (err) {
        setCards(prevCards);
        throw err;
      }
    },
    [cards, optimisticUpdateCard]
  );

  const deleteCardWithOptimism = useCallback(
    async (cardId: string) => {
      const prevCards = [...cards];
      optimisticRemoveCard(cardId);

      try {
        const result = await deleteCard(cardId);
        if (!result.success) {
          setCards(prevCards);
          throw new Error(result.error || "Failed to delete card");
        }
        return result;
      } catch (err) {
        setCards(prevCards);
        throw err;
      }
    },
    [cards, optimisticRemoveCard]
  );

  const createCardWithOptimism = useCallback(
    async (input: CreateCardInput) => {
      const tempId = `temp-${Date.now()}`;
      const tempCard: CardWithDetails = {
        id: tempId,
        board_id: input.board_id,
        list_id: input.list_id,
        title: input.title,
        description: input.description || null,
        position: input.position,
        due_date: null,
        assigned_to: null,
        created_by: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_profile: undefined,
        created_profile: undefined,
      };

      optimisticAddCard(tempCard);

      try {
        const result = await createCard(input);
        if (!result.success || !result.data) {
          setCards((prev) => prev.filter((c) => c.id !== tempId));
          throw new Error(result.error || "Failed to create card");
        }

        // Reload to get full card data with relations
        await loadBoardData();
        return result;
      } catch (err) {
        setCards((prev) => prev.filter((c) => c.id !== tempId));
        throw err;
      }
    },
    [optimisticAddCard, loadBoardData]
  );

  return {
    lists,
    cards,
    isLoading,
    error,
    loadBoardData,
    // List operations
    optimisticUpdateList,
    optimisticReorderLists,
    updateListWithOptimism,
    deleteListWithOptimism,
    createListWithOptimism,
    // Card operations
    optimisticUpdateCard,
    optimisticMoveCard,
    moveCardWithOptimism,
    createCardWithOptimism,
  };
}
