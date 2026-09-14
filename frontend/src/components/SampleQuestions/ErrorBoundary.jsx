import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Could log to an external service here.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Runtime error captured in ErrorBoundary:', error, info);
    }
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{maxWidth:'600px',margin:'2rem auto',padding:'1.5rem',border:'1px solid var(--border-color)',borderRadius:'12px',background:'var(--bg-content)'}}>
          <h2 style={{fontSize:'1rem',marginTop:0}}>خطای غیرمنتظره</h2>
          <p style={{fontSize:'.8rem',lineHeight:1.6, color:'var(--text-secondary)'}}>مشکلی در نمایش این بخش پیش آمد. می‌توانید دوباره تلاش کنید.</p>
          {this.state.error && (
            <pre style={{whiteSpace:'pre-wrap',direction:'ltr',fontSize:'.65rem',background:'var(--bg-muted,#f7f7f7)',padding:'.75rem',borderRadius:'8px',maxHeight:'200px',overflow:'auto'}}>
              {String(this.state.error.message || this.state.error)}
            </pre>
          )}
          <button onClick={this.handleReset} style={{background:'var(--accent-primary-solid)',color:'#fff',border:'none',padding:'.55rem 1rem',borderRadius:'999px',fontSize:'.7rem',cursor:'pointer'}}>تلاش مجدد</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;