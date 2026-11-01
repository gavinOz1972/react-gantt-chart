import { useEffect, useId, useRef } from 'react'

export function ConfirmDialog({ title, children, confirmLabel, confirmDisabled = false, onConfirm, onCancel }: {
  title: string; children: React.ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void
  confirmDisabled?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const heading = useId()
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    cancel.current?.focus()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} aria-labelledby={heading} onCancel={event => { event.preventDefault(); onCancel() }}><h2 id={heading}>{title}</h2>
    {children}<div className="form-actions"><button ref={cancel} type="button" className="quiet" onClick={onCancel}>Cancel</button>
      <button type="button" className="danger" disabled={confirmDisabled} onClick={onConfirm}>{confirmLabel}</button></div></dialog>
}
