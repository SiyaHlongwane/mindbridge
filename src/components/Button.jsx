export default function Button({ children, className = '', type = 'button', ...props }) {
  return <button type={type} className={`button ${className}`} {...props}>{children}</button>
}
