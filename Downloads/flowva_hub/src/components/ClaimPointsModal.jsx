import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './ClaimPointsModal.css'

const ClaimPointsModal = ({ isOpen, onClose, points = 50, toolName = 'Reclaim', onSuccess }) => {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFileName(selectedFile.name)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('You must be logged in to submit a claim')
      return
    }

    if (!email || !file) {
      setError('Please fill in all required fields')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    setIsSubmitting(true)

    try {
      let screenshotUrl = null
      let uploadedFilePath = null

      // Upload file to Supabase Storage
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${toolName.toLowerCase()}-${Date.now()}.${fileExt}`
        uploadedFilePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('point-claims')
          .upload(uploadedFilePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`)
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('point-claims')
          .getPublicUrl(uploadedFilePath)

        screenshotUrl = urlData.publicUrl
      }

      // Save claim submission to database
      const { error: dbError } = await supabase
        .from('point_claims')
        .insert([
          {
            user_id: user.id,
            tool_name: toolName,
            points_claimed: points,
            email: email,
            screenshot_url: screenshotUrl,
            status: 'pending'
          }
        ])

      if (dbError) {
        // If database insert fails, try to delete the uploaded file
        if (uploadedFilePath) {
          await supabase.storage
            .from('point-claims')
            .remove([uploadedFilePath])
        }
        throw new Error(`Failed to save claim: ${dbError.message}`)
      }

      // Reset form
      setEmail('')
      setFile(null)
      setFileName('')
      
      // Close modal
      onClose()
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess({
          message: `Your claim for ${points} points has been submitted successfully! It will be reviewed and approved soon.`,
          points
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to submit claim. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setEmail('')
    setFile(null)
    setFileName('')
    setError('')
    onClose()
  }

  return (
    <div className="claim-points-modal-overlay" onClick={handleCancel}>
      <div className="claim-points-modal" onClick={(e) => e.stopPropagation()}>
        <div tabIndex="0" style={{ outline: 'none' }}>
          <div className="claim-points-modal-content">
            <button
              type="button"
              aria-label="Close"
              className="claim-points-modal-close"
              onClick={handleCancel}
            >
              <span className="claim-points-modal-close-x">
                <span role="img" aria-label="close" className="claim-points-modal-close-icon">
                  <svg
                    fillRule="evenodd"
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="close"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M799.86 166.31c.02 0 .04.02.08.06l57.69 57.7c.04.03.05.05.06.08a.12.12 0 010 .06c0 .03-.02.05-.06.09L569.93 512l287.7 287.7c.04.04.05.06.06.09a.12.12 0 010 .07c0 .02-.02.04-.06.08l-57.7 57.69c-.03.04-.05.05-.07.06a.12.12 0 01-.07 0c-.03 0-.05-.02-.09-.06L512 569.93l-287.7 287.7c-.04.04-.06.05-.09.06a.12.12 0 01-.07 0c-.02 0-.04-.02-.08-.06l-57.69-57.7c-.04-.03-.05-.05-.06-.07a.12.12 0 010-.07c0-.03.02-.05.06-.09L454.07 512l-287.7-287.7c-.04-.04-.05-.06-.06-.09a.12.12 0 010-.07c0-.02.02-.04.06-.08l57.7-57.69c.03-.04.05-.05.07-.06a.12.12 0 01.07 0c.03 0 .05.02.09.06L512 454.07l287.7-287.7c.04-.04.06-.05.09-.06a.12.12 0 01.07 0z"></path>
                  </svg>
                </span>
              </span>
            </button>
            <div className="claim-points-modal-header">
              <div className="claim-points-modal-title">
                <h1 className="md:text-lg">Claim Your {points} Points</h1>
              </div>
            </div>
            <div className="claim-points-modal-body">
              <p className="text-[0.9rem] text-[#6c757d]">
                Sign up for {toolName} (free, no payment needed), then fill the form below:
              </p>
              <ul className="text-[0.9rem] text-[#6c757d]">
                <li>1️⃣ Enter your {toolName} sign-up email.</li>
                <li>2️⃣ Upload a screenshot of your {toolName} profile showing your email.</li>
              </ul>
              <p className="text-[0.9rem] text-[#6c757d]">
                After verification, you'll get {points} Flowva Points! 🎉😊
              </p>
              <form className="mt-3" onSubmit={handleSubmit}>
                {error && (
                  <div className="error-message" style={{ marginBottom: '1rem', color: '#dc3545', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#111827]">
                  Email used on {toolName}
                </label>
                <div className="relative group w-full mb-5 email-input-wrapper">
                  <input
                    type="email"
                    id="email"
                    placeholder="user@example.com"
                    className="w-full border text-base py-[10px] px-[14px] border-[#EDE9FE] transition-all ease-linear duration-[.2s] rounded-md outline-none focus:border-[#9013fe]"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-md focus-shadow"></div>
                </div>
                <label htmlFor="file" className="block text-sm mb-[0.5rem] font-medium text-[#111827]">
                  Upload screenshot (mandatory)
                </label>
                <label className="p-[0.5rem] cursor-pointer hover:bg-[rgba(29,28,28,0.05)] block border border-dashed border-[#e9ecef] rounded-[8px] bg-[#f9f9f9] transition-all duration-200">
                  <p className="text-center flex justify-center gap-[0.5rem]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-cloud-download"
                    >
                      <path d="M12 13v8l-4-4"></path>
                      <path d="m12 21 4-4"></path>
                      <path d="M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284"></path>
                    </svg>
                    <span className="text-base">{fileName || 'Choose file'}</span>
                  </p>
                  <input
                    className="hidden"
                    type="file"
                    id="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                  />
                </label>
                <div className="flex gap-3 justify-end mt-4">
                  <button
                    type="button"
                    className="p-[0.5rem_1rem] rounded-[8px] font-semibold transition-all duration-200 hover:bg-[#d1d5db] bg-[#e9ecef] text-[#020617]"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="p-[0.5rem_1rem] rounded-[8px] font-semibold transition-all duration-200 bg-[#9103fe] text-white hover:bg-[#FF8687] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div tabIndex="0" style={{ width: '0px', height: '0px', overflow: 'hidden', outline: 'none' }}></div>
      </div>
    </div>
  )
}

export default ClaimPointsModal

