import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ConfirmTone = 'danger' | 'info'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
}

type ConfirmDialogState = Required<ConfirmOptions> & {
  resolve: (value: boolean) => void
}

type FeedbackContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

const defaultLabels = {
  title: 'Confirmar accion',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  tone: 'info' as ConfirmTone,
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null)

  useEffect(() => {
    return () => {
      if (dialog) {
        dialog.resolve(false)
      }
    }
  }, [dialog])

  useEffect(() => {
    if (!dialog) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        dialog.resolve(false)
        setDialog(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialog])

  const value = useMemo<FeedbackContextValue>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          setDialog((current) => {
            if (current) {
              current.resolve(false)
            }

            if (typeof options === 'string') {
              return {
                title: defaultLabels.title,
                message: options,
                confirmLabel: defaultLabels.confirmLabel,
                cancelLabel: defaultLabels.cancelLabel,
                tone: defaultLabels.tone,
                resolve,
              }
            }

            return {
              title: options.title ?? defaultLabels.title,
              message: options.message,
              confirmLabel: options.confirmLabel ?? defaultLabels.confirmLabel,
              cancelLabel: options.cancelLabel ?? defaultLabels.cancelLabel,
              tone: options.tone ?? defaultLabels.tone,
              resolve,
            }
          })
        }),
    }),
    [],
  )

  const closeDialog = (confirmed: boolean) => {
    if (!dialog) {
      return
    }

    dialog.resolve(confirmed)
    setDialog(null)
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {dialog ? (
        <div
          className="feedback-dialog-overlay"
          role="presentation"
          onClick={() => closeDialog(false)}
        >
          <section
            className="feedback-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`feedback-dialog-icon feedback-dialog-icon-${dialog.tone}`}>
              {dialog.tone === 'danger' ? '!' : '?'}
            </div>
            <div className="feedback-dialog-copy">
              <p className="feedback-dialog-eyebrow">
                {dialog.tone === 'danger' ? 'Accion sensible' : 'Confirma antes de seguir'}
              </p>
              <h2 id="feedback-dialog-title">{dialog.title}</h2>
              <p>{dialog.message}</p>
            </div>
            <div className="feedback-dialog-actions">
              <button
                className="secondary-link button-link"
                type="button"
                onClick={() => closeDialog(false)}
              >
                {dialog.cancelLabel}
              </button>
              <button
                className={dialog.tone === 'danger' ? 'remove-link' : 'primary-link button-link'}
                type="button"
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)

  if (!context) {
    throw new Error('FeedbackProvider is required to use feedback dialogs.')
  }

  return context
}
