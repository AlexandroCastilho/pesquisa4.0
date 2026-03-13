export class SessionInvalidError extends Error {
  constructor(message = "Sessão inválida. Faça login novamente.") {
    super(message);
    this.name = "SessionInvalidError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor(message = "Perfil do usuário não encontrado.") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}

export class UserWithoutEmpresaError extends Error {
  constructor(message = "Usuário sem empresa vinculada.") {
    super(message);
    this.name = "UserWithoutEmpresaError";
  }
}

export class InactiveUserError extends Error {
  constructor(message = "Sua conta está desativada. Fale com o administrador da sua empresa.") {
    super(message);
    this.name = "InactiveUserError";
  }
}
