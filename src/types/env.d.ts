interface TrustedTypePolicyOptions {
  createScriptURL?: (input: string) => string;
}

interface TrustedTypePolicyFactory {
  createPolicy(name: string, options: TrustedTypePolicyOptions): unknown;
}

declare var trustedTypes: TrustedTypePolicyFactory | undefined;

interface ImportMetaEnv {
  readonly APP_VERSION: string;
}
