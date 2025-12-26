import { useEffect, useRef } from 'react'
import './ClaimSuccessModal.css'

const ClaimSuccessModal = ({ isOpen, onClose, points = 5 }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.offsetWidth
    const height = canvas.height = canvas.offsetHeight

    const particles = []
    const particleCount = 50

    // Create confetti particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 5 + 2,
        color: ['#9013fe', '#FF9FF5', '#70D6FF', '#FF8687'][Math.floor(Math.random() * 4)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      })
    }

    let animationId
    let startTime = Date.now()
    const animationDuration = 3000 // 3 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime
      
      // Stop animation after duration
      if (elapsed > animationDuration) {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        return
      }

      ctx.clearRect(0, 0, width, height)
      
      let activeParticles = 0
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.rotationSpeed
        particle.vy += 0.1 // gravity

        // Only draw particles that haven't fallen off screen
        if (particle.y < height + particle.size) {
          activeParticles++
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)
          ctx.fillStyle = particle.color
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
          ctx.restore()
        }
      })

      // Continue animation if there are active particles or time hasn't elapsed
      if (activeParticles > 0 || elapsed < animationDuration) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="claim-success-modal-overlay" onClick={onClose}>
      <div className="claim-success-modal" onClick={(e) => e.stopPropagation()}>
        <button className="claim-success-modal-close" onClick={onClose}>
          <svg fillRule="evenodd" viewBox="64 64 896 896" focusable="false" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"></path>
          </svg>
        </button>
        <div className="claim-success-modal-body">
          <div className="relative overflow-hidden">
            <canvas ref={canvasRef} className="confetti-canvas" />
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            <h2 className="success-title">Level Up! 🎉</h2>
            <div className="points-display">+{points} Points</div>
            <div className="emoji-animation">
              <span className="animate-bounce">✨</span>
              <span className="animate-bounce">💎</span>
              <span className="animate-bounce">🎯</span>
            </div>
            <p className="success-messagee">
              You&#39;ve claimed your daily points! Come back<br />
              tomorrow for more!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClaimSuccessModal

