export type RoleScopeActor = {
  actorRole: string;
  actorRestaurantId: number | null;
  actorManagedRestaurantIds: number[];
};

export type RoleScopeActorWithId = RoleScopeActor & {
  actorId: number;
};

export type RequestLike = {
  protocol: string;
  get: (name: string) => string | undefined;
};
