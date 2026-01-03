import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'bounce-gentle': {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-5px)'
  				}
  			},
  			'wiggle': {
  				'0%, 100%': {
  					transform: 'rotate(-3deg)'
  				},
  				'50%': {
  					transform: 'rotate(3deg)'
  				}
  			},
  			'heart-pop': {
  				'0%': {
  					transform: 'scale(0)',
  					opacity: '0'
  				},
  				'50%': {
  					transform: 'scale(1.3)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'float-up': {
  				'0%': {
  					transform: 'translateY(0) scale(1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateY(-30px) scale(0.5)',
  					opacity: '0'
  				}
  			},
  			'sparkle': {
  				'0%, 100%': {
  					opacity: '0',
  					transform: 'scale(0)'
  				},
  				'50%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			'glow-pulse': {
  				'0%, 100%': {
  					boxShadow: '0 0 5px 0 hsl(var(--primary) / 0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 20px 5px hsl(var(--primary) / 0.5)'
  				}
  			},
  			'rainbow': {
  				'0%': {
  					borderColor: 'hsl(0, 80%, 60%)'
  				},
  				'16%': {
  					borderColor: 'hsl(60, 80%, 60%)'
  				},
  				'33%': {
  					borderColor: 'hsl(120, 80%, 60%)'
  				},
  				'50%': {
  					borderColor: 'hsl(180, 80%, 60%)'
  				},
  				'66%': {
  					borderColor: 'hsl(240, 80%, 60%)'
  				},
  				'83%': {
  					borderColor: 'hsl(300, 80%, 60%)'
  				},
  				'100%': {
  					borderColor: 'hsl(360, 80%, 60%)'
  				}
  			},
  			'shake': {
  				'0%, 100%': {
  					transform: 'translateX(0)'
  				},
  				'25%': {
  					transform: 'translateX(-5px)'
  				},
  				'75%': {
  					transform: 'translateX(5px)'
  				}
  			},
  			'grade-glow': {
  				'0%, 100%': {
  					boxShadow: '0 0 10px 2px var(--grade-color)',
  					filter: 'brightness(1)'
  				},
  				'50%': {
  					boxShadow: '0 0 25px 8px var(--grade-color)',
  					filter: 'brightness(1.1)'
  				}
  			},
  			'star-spin': {
  				'0%': {
  					transform: 'rotate(0deg)'
  				},
  				'100%': {
  					transform: 'rotate(360deg)'
  				}
  			},
			'confetti': {
				'0%': {
					transform: 'translateY(0) rotate(0deg)',
					opacity: '1'
				},
				'100%': {
					transform: 'translateY(100px) rotate(720deg)',
					opacity: '0'
				}
			},
			'progress-pop': {
				'0%': {
					transform: 'scale(1)'
				},
				'50%': {
					transform: 'scale(1.15)'
				},
				'100%': {
					transform: 'scale(1)'
				}
			},
			'progress-float': {
				'0%': {
					transform: 'translateY(0) scale(1)',
					opacity: '1'
				},
				'100%': {
					transform: 'translateY(-40px) scale(0.8)',
					opacity: '0'
				}
			},
			'streak-flame': {
				'0%, 100%': {
					transform: 'scale(1) rotate(-2deg)'
				},
				'50%': {
					transform: 'scale(1.1) rotate(2deg)'
				}
			},
			'shimmer': {
				'0%': {
					backgroundPosition: '-200% 0'
				},
				'100%': {
					backgroundPosition: '200% 0'
				}
			},
			'vip-glow': {
				'0%, 100%': {
					boxShadow: '0 0 10px 2px hsl(45 100% 50% / 0.3)'
				},
				'50%': {
					boxShadow: '0 0 20px 5px hsl(45 100% 50% / 0.5)'
				}
			},
			'heart-cascade': {
				'0%': {
					transform: 'translateY(0) translateX(0) scale(0)',
					opacity: '0'
				},
				'20%': {
					transform: 'translateY(-15px) translateX(var(--x-spread)) scale(1)',
					opacity: '1'
				},
				'100%': {
					transform: 'translateY(-80px) translateX(var(--x-spread)) scale(0.3)',
					opacity: '0'
				}
			},
			'spark-burst': {
				'0%': {
					transform: 'translate(0, 0) scale(0) rotate(0deg)',
					opacity: '1'
				},
				'30%': {
					transform: 'translate(var(--x-spread), var(--y-spread)) scale(1.2) rotate(var(--rotation))',
					opacity: '1'
				},
				'100%': {
					transform: 'translate(calc(var(--x-spread) * 1.5), calc(var(--y-spread) * 1.5)) scale(0) rotate(calc(var(--rotation) * 2))',
					opacity: '0'
				}
			},
			'slide-in-top': {
				'0%': {
					transform: 'translateY(-100%) translateX(-50%)',
					opacity: '0'
				},
				'100%': {
					transform: 'translateY(0) translateX(-50%)',
					opacity: '1'
				}
			},
			'edge-glow': {
				'0%': {
					opacity: '0'
				},
				'30%': {
					opacity: '1'
				},
				'100%': {
					opacity: '0'
				}
			},
			'float-up-enhanced': {
				'0%': {
					transform: 'translateY(0) scale(1)',
					opacity: '1'
				},
				'50%': {
					opacity: '1'
				},
				'100%': {
					transform: 'translateY(-60px) scale(0.4)',
					opacity: '0'
				}
			},
			'line-pulse': {
				'0%, 100%': {
					opacity: '1'
				},
				'50%': {
					opacity: '0.6'
				}
			},
			'line-tension': {
				'0%, 100%': {
					transform: 'translateY(0)'
				},
				'25%': {
					transform: 'translateY(-0.5px)'
				},
				'75%': {
					transform: 'translateY(0.5px)'
				}
			},
			'node-highlight': {
				'0%, 100%': {
					boxShadow: '0 0 0 0 var(--highlight-color)'
				},
				'50%': {
					boxShadow: '0 0 8px 3px var(--highlight-color)'
				}
			},
			'emoji-pop': {
				'0%': {
					transform: 'scale(0) rotate(-15deg)',
					opacity: '0'
				},
				'50%': {
					transform: 'scale(1.3) rotate(5deg)',
					opacity: '1'
				},
				'100%': {
					transform: 'scale(1) rotate(0deg)',
					opacity: '1'
				}
			},
			'emoji-burst': {
				'0%': {
					transform: 'translate(0, 0) scale(0)',
					opacity: '0'
				},
				'30%': {
					transform: 'translate(calc(var(--burst-x) * 0.5), calc(var(--burst-y) * 0.5)) scale(1.2)',
					opacity: '1'
				},
				'100%': {
					transform: 'translate(var(--burst-x), var(--burst-y)) scale(0.3)',
					opacity: '0'
				}
			},
			'emoji-wiggle': {
				'0%, 100%': { transform: 'rotate(-8deg) scale(1)' },
				'25%': { transform: 'rotate(8deg) scale(1.1)' },
				'50%': { transform: 'rotate(-8deg) scale(1)' },
				'75%': { transform: 'rotate(8deg) scale(1.1)' }
			},
			'emoji-shake': {
				'0%, 100%': { transform: 'translateX(0)' },
				'20%': { transform: 'translateX(-3px)' },
				'40%': { transform: 'translateX(3px)' },
				'60%': { transform: 'translateX(-3px)' },
				'80%': { transform: 'translateX(3px)' }
			},
			'card-glow': {
				'0%': { boxShadow: '0 0 0 0 var(--glow-color)' },
				'50%': { boxShadow: '0 0 15px 5px var(--glow-color)' },
				'100%': { boxShadow: '0 0 0 0 var(--glow-color)' }
			},
			// Cat Avatar Animations
			'cat-blink': {
				'0%, 92%, 100%': { transform: 'scaleY(0)' },
				'94%, 98%': { transform: 'scaleY(1)' }
			},
			'ear-twitch-left': {
				'0%, 85%, 100%': { transform: 'rotate(-20deg)' },
				'88%': { transform: 'rotate(-28deg)' },
				'91%': { transform: 'rotate(-16deg)' }
			},
			'ear-twitch-right': {
				'0%, 70%, 100%': { transform: 'rotate(20deg)' },
				'73%': { transform: 'rotate(28deg)' },
				'76%': { transform: 'rotate(16deg)' }
			},
			'eye-shimmer': {
				'0%, 100%': { opacity: '0.9', transform: 'translate(0, 0)' },
				'50%': { opacity: '1', transform: 'translate(1px, -0.5px)' }
			},
			'whisker-wiggle': {
				'0%, 100%': { transform: 'rotate(0deg)' },
				'25%': { transform: 'rotate(1deg)' },
				'75%': { transform: 'rotate(-1deg)' }
			},
			'cat-breathe': {
				'0%, 100%': { transform: 'scale(1)' },
				'50%': { transform: 'scale(1.015)' }
			}
		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
  			'wiggle': 'wiggle 0.5s ease-in-out',
  			'heart-pop': 'heart-pop 0.4s ease-out forwards',
  			'float-up': 'float-up 1s ease-out forwards',
  			'sparkle': 'sparkle 1.5s ease-in-out infinite',
  			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
  			'rainbow': 'rainbow 3s linear infinite',
  			'shake': 'shake 0.3s ease-in-out',
  			'grade-glow': 'grade-glow 2s ease-in-out infinite',
  			'star-spin': 'star-spin 4s linear infinite',
			'confetti': 'confetti 1s ease-out forwards',
			'progress-pop': 'progress-pop 0.3s ease-out',
			'progress-float': 'progress-float 0.8s ease-out forwards',
			'streak-flame': 'streak-flame 0.5s ease-in-out infinite',
			'shimmer': 'shimmer 3s linear infinite',
			'vip-glow': 'vip-glow 2s ease-in-out infinite',
			'heart-cascade': 'heart-cascade 2s ease-out forwards',
			'spark-burst': 'spark-burst 0.8s ease-out forwards',
			'slide-in-top': 'slide-in-top 0.4s ease-out forwards',
			'edge-glow': 'edge-glow 0.8s ease-out forwards',
			'float-up-enhanced': 'float-up-enhanced 2s ease-out forwards',
			'line-pulse': 'line-pulse 2s ease-in-out infinite',
			'line-tension': 'line-tension 0.5s ease-in-out infinite',
			'node-highlight': 'node-highlight 1s ease-in-out infinite',
			'emoji-pop': 'emoji-pop 0.4s ease-out forwards',
			'emoji-burst': 'emoji-burst 0.6s ease-out forwards',
			'emoji-wiggle': 'emoji-wiggle 0.8s ease-in-out 2',
			'emoji-shake': 'emoji-shake 0.4s ease-in-out 2',
			'card-glow': 'card-glow 0.8s ease-out forwards',
			// Cat Avatar Animations
			'cat-blink': 'cat-blink 5s ease-in-out infinite',
			'ear-twitch-left': 'ear-twitch-left 6s ease-in-out infinite',
			'ear-twitch-right': 'ear-twitch-right 7s ease-in-out infinite',
			'eye-shimmer': 'eye-shimmer 2s ease-in-out infinite',
			'whisker-wiggle': 'whisker-wiggle 3s ease-in-out infinite',
			'cat-breathe': 'cat-breathe 3s ease-in-out infinite'
		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		fontFamily: {
  			sans: [
  				'Lato',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'EB Garamond',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Fira Code',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
