import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBatches,
  fetchBatchDetail,
  createBatch,
  deleteBatch,
  addStudentsToBatch,
  removeStudentFromBatch,
} from "../api/batchApi";

export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: fetchBatches,
  });
}

export function useBatchDetail(batchId) {
  return useQuery({
    queryKey: ["batches", batchId],
    queryFn: () => fetchBatchDetail(batchId),
    enabled: !!batchId,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBatch,
    onSuccess: (_, batchId) => {
      queryClient.removeQueries({ queryKey: ["batches", batchId] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useAddStudentsToBatch(batchId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentIds) => addStudentsToBatch(batchId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches", batchId] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useRemoveStudentFromBatch(batchId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId) => removeStudentFromBatch(batchId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches", batchId] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}