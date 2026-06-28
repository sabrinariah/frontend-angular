export const environment = {
  production: true,
  // Chemins relatifs : nginx (voir nginx.conf) proxy /api et /auth vers le backend.
  apiUrl: '/api',
  backendAuthUrl: '/auth',
  keycloak: {
    // Doit être atteignable directement par le navigateur (redirections OIDC) :
    // adapter à l'URL publique réelle de Keycloak en production.
    url: 'http://localhost:8080',
    realm: 'projet',
    clientId: 'app-angular',
    // À fournir au moment du build/déploiement (variable CI), ne pas committer la vraie valeur.
    clientSecret: ''
  }
};
