import type { Group } from 'three'

export interface Entity {
  update(deltaTime: number): void
  mount(group: Group): void
  unmount(): void
}
