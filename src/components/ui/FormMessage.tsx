type Props = { error?: string; message?: string };

// Mensaje de resultado de un formulario (éxito o error general).
const FormMessage = ({ error, message }: Props) => {
  if (error) {
    return (
      <p role="alert" className="m-0 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="m-0 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-cream">
        {message}
      </p>
    );
  }
  return null;
};

export default FormMessage;
