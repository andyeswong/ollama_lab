import type { CalculationParams, CalculationResult, Precision } from "./types"

const PRECISION_MULTIPLIERS: Record<Precision, number> = {
  fp32: 2.0,
  fp16: 1.0,
  int8: 0.5,
  int4: 0.25,
}

export function calculateVRAM(params: CalculationParams): CalculationResult {
  const { model, contextLength, precision, batchSize, frameworkOverhead } = params

  // Base model VRAM (convert bytes to MB and apply precision multiplier)
  const baseModelMB = (model.size / (1024 * 1024)) * PRECISION_MULTIPLIERS[precision]

  // Context buffer calculation
  // Approximate: 2 bytes per token per layer (rough estimate)
  // This is a simplified calculation - actual values depend on model architecture
  const estimatedLayers = getEstimatedLayers(model.size)
  const contextBufferMB = (contextLength * 2 * estimatedLayers * batchSize) / (1024 * 1024)

  // Total VRAM in MB
  const totalVramMB = baseModelMB + contextBufferMB + frameworkOverhead

  // Convert to GB for final result
  const totalVramGB = totalVramMB / 1024

  return {
    baseModelVram: baseModelMB,
    contextBuffer: contextBufferMB,
    frameworkOverhead,
    totalVram: totalVramGB,
    precision,
    contextLength,
    batchSize,
  }
}

function getEstimatedLayers(modelSizeBytes: number): number {
  // Rough estimation based on model size
  // This is a simplified heuristic
  const modelSizeGB = modelSizeBytes / (1024 * 1024 * 1024)

  if (modelSizeGB < 1) return 12 // Small models (7B and below)
  if (modelSizeGB < 8) return 32 // Medium models (13B)
  if (modelSizeGB < 15) return 40 // Large models (30B)
  if (modelSizeGB < 30) return 60 // Very large models (65B)
  return 80 // Huge models (70B+)
}
