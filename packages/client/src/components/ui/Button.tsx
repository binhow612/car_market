import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default trả về style chuẩn (nền tối) hoặc bạn có thể chỉnh tùy ý
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        
        // --- SỬA Ở ĐÂY: Áp dụng style "Ưa thích" vào variant 'outline' ---
        // Style: Nền xám nhạt, viền đen. Hover/Active: Nền đen, chữ trắng.
        outline:
          "bg-gray-100 text-gray-900 border border-black hover:bg-black hover:text-white hover:shadow-lg active:bg-black active:text-white",
        // ---------------------------------------------------------------

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-full px-3",
        lg: "h-12 rounded-full px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        // Luôn bo tròn đều (rounded-full) cho tất cả các nút
        className={cn(buttonVariants({ variant, size, className }), "rounded-full")}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }