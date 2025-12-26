import './TopToolSpotlight.css'

const TopToolSpotlight = ({ tool, onClaim }) => {
  if (!tool) {
    tool = {
      name: 'Reclaim',
      description: 'Reclaim.ai is an AI-powered calendar assistant that automatically schedules your tasks, meetings, and breaks to boost productivity. Free to try — earn Flowva Points when you sign up!',
      points: 50,
      imageUrl: null,
      signupUrl: 'https://go.reclaim.ai/ur9i6g5eznps', // Default signup URL for Reclaim
    }
  }

  const handleClaimClick = () => {
    if (onClaim) {
      onClaim(tool)
    }
  }

  const handleSignUpClick = () => {
    // Redirect to external signup URL (like Reclaim.ai does)
    // You can customize this URL per tool or use a default
    const signupUrl = tool.signupUrl || 'https://go.reclaim.ai/ur9i6g5eznps'
    window.open(signupUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="top-tool-spotlight">
      <div className="card-header">
        <span className="featured-badge">Featured</span>
        <div className="header-content-row">
          <h3 className="card-title">Top Tool Spotlight</h3>
          <div className="tool-image">
            {tool.imageUrl ? (
              <img src={tool.imageUrl} alt={tool.name} className="tool-image-img" />
            ) : (
              <div className="tool-image-placeholder">
                <img 
                  src="https://api.flowvahub.com/storage/v1/object/public/icons//reclaim%20(1).png" 
                  alt={tool.name}
                  className="tool-image-img"
                />
              </div>
            )}
          </div>
        </div>
        <p className="tool-name-text">
          <strong>{tool.name}</strong>
        </p>
      </div>
      <div className="tool-content">
        <div className="tool-info">
          <div className="tool-info-row">
            <div className="calendar-icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
            </div>
            <div className="tool-text-content">
              <h4 className="tool-subtitle">Automate and Optimize Your Schedule</h4>
              <p className="tool-description">{tool.description}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="tool-actions">
        <button className="signup-button" onClick={handleSignUpClick}>
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="user-plus" style={{ width: '14px', height: '14px' }} role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
            <path fill="currentColor" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"></path>
          </svg>
          Sign up
        </button>
        <button className="claim-points-button" onClick={handleClaimClick}>
          <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="gift" style={{ width: '14px', height: '14px' }} role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path fill="currentColor" d="M190.5 68.8L225.3 128l-1.3 0-72 0c-22.1 0-40-17.9-40-40s17.9-40 40-40l2.2 0c14.9 0 28.8 7.9 36.3 20.8zM64 88c0 14.4 3.5 28 9.6 40L32 128c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32l448 0c17.7 0 32-14.3 32-32l0-64c0-17.7-14.3-32-32-32l-41.6 0c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88l-2.2 0c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0L152 0C103.4 0 64 39.4 64 88zm336 0c0 22.1-17.9 40-40 40l-72 0-1.3 0 34.8-59.2C329.1 55.9 342.9 48 357.8 48l2.2 0c22.1 0 40 17.9 40 40zM32 288l0 176c0 26.5 21.5 48 48 48l144 0 0-224L32 288zM288 512l144 0c26.5 0 48-21.5 48-48l0-176-192 0 0 224z"></path>
          </svg>
          Claim {tool.points} pts
        </button>
      </div>
    </div>
  )
}

export default TopToolSpotlight

