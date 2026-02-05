'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Code, Palette, Share, Zap, Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleThemeToggle } from '@/components/ui/theme-toggle'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const features = [
    {
      icon: Code,
      title: 'Showcase Your Work',
      description: 'Display your projects, skills, and achievements in a professional portfolio'
    },
    {
      icon: Palette,
      title: 'Beautiful Themes',
      description: 'Choose from multiple responsive themes designed for developers'
    },
    {
      icon: Share,
      title: 'Easy Sharing',
      description: 'Share your portfolio with a unique URL - yourname.devlink.vercel.app'
    },
    {
      icon: Zap,
      title: 'Quick Setup',
      description: 'Get started in minutes with OAuth authentication and intuitive interface'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <motion.nav
        className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Code className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-foreground">DevLink</span>
            </div>
            <div className="flex items-center space-x-4">
              <SimpleThemeToggle />
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-foreground mb-6"
              variants={fadeIn}
            >
              Build Your
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Developer Story
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              variants={fadeIn}
            >
              Create a stunning developer portfolio in minutes. Showcase your projects,
              skills, and experience with beautiful, responsive themes.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeIn}
            >
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg group"
                >
                  Create Your Portfolio
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                  View Examples
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
              variants={fadeIn}
            >
              <div>
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">1000+</div>
                <div className="text-muted-foreground">Developers</div>
              </div>
              <div>
                <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">50+</div>
                <div className="text-muted-foreground">Templates</div>
              </div>
              <div>
                <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">2 min</div>
                <div className="text-muted-foreground">Setup Time</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features to showcase your developer journey
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-border"
                variants={fadeIn}
                whileHover={{ y: -5 }}
              >
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Build Your Portfolio?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of developers who trust DevLink to showcase their work
            </p>
            <Link href="/auth/signin">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                Get Started for Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Code className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-foreground">DevLink</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 DevLink. Built with ❤️ for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}