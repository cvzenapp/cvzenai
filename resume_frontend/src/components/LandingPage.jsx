import React from 'react'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  const features = [
    {
      icon: "📤",
      title: "Smart Upload",
      description: "Upload your existing resume in PDF, DOCX, or TXT format and our AI will parse every detail automatically."
    },
    {
      icon: "✏️",
      title: "Intelligent Editing",
      description: "Edit every section with our intuitive interface. Add, remove, or modify content with real-time preview."
    },
    {
      icon: "📄",
      title: "Professional PDF",
      description: "Generate beautiful, ATS-friendly PDF resumes with multiple professional templates to choose from."
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Create and update your resume in minutes, not hours. Our streamlined process saves you valuable time."
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your data is encrypted and secure. We never share your personal information with third parties."
    },
    {
      icon: "👥",
      title: "Multiple Resumes",
      description: "Create and manage multiple resume versions for different job applications and career paths."
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      content: "cvZen helped me land my dream job at a tech startup. The parsing was incredibly accurate!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Marketing Manager",
      content: "I love how easy it is to customize my resume for different positions. The templates are professional and modern.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Data Scientist",
      content: "The AI parsing saved me hours of manual data entry. Highly recommend for anyone job hunting!",
      rating: 5
    }
  ]

  const benefits = [
    "Parse any resume format with 99% accuracy",
    "Professional templates designed by experts",
    "ATS-optimized for better job application success",
    "Real-time editing with instant preview",
    "Secure cloud storage for all your resumes",
    "Export to multiple formats (PDF, DOCX)",
    "Mobile-responsive design for editing on-the-go",
    "24/7 customer support"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">cv</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                cvZen
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <button className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-white rounded-full px-4 py-2 mb-6 shadow-md border border-gray-200">
              <span className="text-2xl mr-2">✨</span>
              <span className="text-sm font-medium text-gray-700">AI-Powered Resume Builder</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900">
              Create Professional Resumes with 
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent"> cvZen</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload your existing resume and let our AI parse every detail. Edit with ease, 
              choose from professional templates, and download as a polished PDF ready for any job application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center">
                  Start Building Now
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
              <button className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors border border-gray-300 shadow-md">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
              Everything You Need to Build the Perfect Resume
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform handles every aspect of resume creation, 
              from intelligent parsing to professional formatting.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-8 border border-gray-100 transform hover:-translate-y-1">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
                Why Choose cvZen?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of professionals who have successfully landed their dream jobs 
                using our advanced resume building platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 h-96 flex items-center justify-center shadow-xl border border-gray-200">
                <div className="text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-2xl font-semibold mb-2 text-gray-900">Professional Results</h3>
                  <p className="text-gray-600">
                    Beautiful, ATS-optimized resumes that get noticed by recruiters with cvZen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
              Loved by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users have to say about their experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
              Ready to Build Your Perfect Resume?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of professionals who have already transformed their careers. 
              Start building your professional resume today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center">
                  Get Started for Free
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
              <Link to="/login">
                <button className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors border border-gray-300 shadow-md">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">cv</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                cvZen
              </span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 cvZen. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

