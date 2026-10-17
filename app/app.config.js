// Envoltorio de app.json. «Iniciar sesión con Apple» necesita la capacidad (entitlement) de Apple Sign In, que solo existe en
// una cuenta de Apple Developer de pago. Con una cuenta gratuita (AltStore/Sideloadly) la firma FALLA si el IPA la lleva,
// así que por defecto va desactivada y el botón no se muestra. Para activarla: compilar con APPLE_SIGN_IN=1 y firmar con
// un perfil de aprovisionamiento que incluya «Sign in with Apple».
module.exports = ({ config }) => {
  const on = process.env.APPLE_SIGN_IN === '1';
  return {
    ...config,
    ios: { ...config.ios, ...(on && { usesAppleSignIn: true }) },
    plugins: [...(config.plugins ?? []), ...(on ? ['expo-apple-authentication'] : [])],
    extra: { ...(config.extra ?? {}), appleSignIn: on },
  };
};
