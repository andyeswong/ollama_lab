export interface OllamaModel {
  name: string
  size: number
  modified_at: string
  digest: string
  details?: {
    family?: string
    format?: string
    parameter_size?: string
    quantization_level?: string
  }
}

export type Precision = "fp32" | "fp16" | "int8" | "int4"

export interface CalculationParams {
  model: OllamaModel
  contextLength: number
  precision: Precision
  batchSize: number
  frameworkOverhead: number // in MB
}

export interface CalculationResult {
  baseModelVram: number // in MB
  contextBuffer: number // in MB
  frameworkOverhead: number // in MB
  totalVram: number // in GB
  precision: Precision
  contextLength: number
  batchSize: number
}
