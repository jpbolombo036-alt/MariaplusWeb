export interface EventSetupTask {
  label: string
  run(): Promise<unknown>
}

/** L'événement existe déjà : un échec facultatif ne doit pas interrompre la suite. */
export async function runEventSetup(tasks: EventSetupTask[]): Promise<string[]> {
  const failures: string[] = []
  for (const task of tasks) {
    try {
      await task.run()
    } catch {
      failures.push(task.label)
    }
  }
  return failures
}

export function eventSetupWarning(failures: string[]): string {
  if (!failures.length) return ''
  return `Événement créé, mais certains éléments n'ont pas pu être enregistrés : ${failures.join(', ')}. Vous pouvez réessayer depuis la fiche de l'événement.`
}