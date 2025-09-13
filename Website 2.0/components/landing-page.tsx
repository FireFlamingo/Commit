"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Key, Users, Zap, CheckCircle } from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <Shield className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance">Hasheger</h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 text-balance">
              Your passwords, secured with military-grade encryption
            </p>
            <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto text-pretty">
              Stop reusing weak passwords. Hasheger generates, stores, and autofills unique passwords for every account,
              keeping your digital life secure and simple.
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-4 h-auto font-semibold"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">Why Choose Hasheger?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Built with security-first principles and designed for everyday use
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">End-to-End Encryption</h3>
                <p className="text-muted-foreground text-pretty">
                  Your data is encrypted locally before it ever leaves your device. Not even we can see your passwords.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Key className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">Password Generator</h3>
                <p className="text-muted-foreground text-pretty">
                  Generate cryptographically secure passwords with customizable length and complexity requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">Secure Sharing</h3>
                <p className="text-muted-foreground text-pretty">
                  Share passwords and sensitive information with team members using encrypted, time-limited links.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">Biometric Authentication</h3>
                <p className="text-muted-foreground text-pretty">
                  Access your vault instantly with fingerprint, Face ID, or other WebAuthn-compatible authenticators.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">Zero-Knowledge Architecture</h3>
                <p className="text-muted-foreground text-pretty">
                  We can't see your data even if we wanted to. Your master password never leaves your device.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-4">Cross-Platform Sync</h3>
                <p className="text-muted-foreground text-pretty">
                  Access your passwords on any device with seamless, encrypted synchronization across all platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-balance">
              Trusted by Security Professionals
            </h2>
            <p className="text-lg text-muted-foreground mb-12 text-pretty">
              "Hasheger's zero-knowledge architecture and WebAuthn integration make it the most secure password manager
              I've used. The biometric authentication is seamless and the encryption is bulletproof."
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Alex Chen</p>
                <p className="text-sm">Security Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-balance">
              Ready to Secure Your Digital Life?
            </h2>
            <p className="text-lg text-white/90 mb-8 text-pretty">
              Join thousands of users who trust Hasheger to keep their passwords safe
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-4 h-auto font-semibold"
              >
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">Hasheger</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
