import type {
  PipelineStage,
  StructuredOutputProvider,
  StructuredOutputRequest,
  StructuredOutputResponse,
} from "@refriq/application";

export class FixtureFakeLlmProvider implements StructuredOutputProvider {
  readonly requests: StructuredOutputRequest[] = [];
  readonly #responses: Partial<Record<PipelineStage, unknown[]>>;

  constructor(responses: Partial<Record<PipelineStage, readonly unknown[]>>) {
    this.#responses = Object.fromEntries(
      Object.entries(responses).map(([stage, values]) => [
        stage,
        [...(values ?? [])],
      ]),
    );
  }

  async generateStructuredOutput(
    request: StructuredOutputRequest,
  ): Promise<StructuredOutputResponse> {
    this.requests.push(request);
    const response = this.#responses[request.stage]?.shift();
    if (response instanceof Error) throw response;
    if (response === undefined) {
      throw new Error(`No fake response configured for ${request.stage}`);
    }
    return {
      output: structuredClone(response),
      generationMetadata: {
        providerId: "fixture-fake",
        promptVersion: "pipeline-fixtures-v1",
      },
    };
  }
}
