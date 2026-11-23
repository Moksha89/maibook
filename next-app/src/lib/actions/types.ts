export interface ActionState {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: Record<string, string>;
}
