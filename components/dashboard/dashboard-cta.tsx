"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface DashboardCTAProps {
  className?: string;
}

export function DashboardCTA({ className = "" }: DashboardCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="bg-white dark:bg-gray-800 border-none p-8 h-full relative overflow-hidden">
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-bold text-[#1b2559] dark:text-white mb-4 leading-tight"
            >
              Ready to organize your work?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-base font-medium text-[#a3aed0] dark:text-gray-400 mb-8 max-w-md"
            >
              Create boards, organize tasks, and collaborate with your team efficiently.
            </motion.p>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button size="lg" className="bg-[#4318ff] hover:bg-[#3311dd] text-white font-medium rounded-full px-8">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Board
              </Button>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-base font-medium text-[#a3aed0] hover:text-[#4318ff] transition-colors"
            >
              Skip
            </motion.button>
          </div>
        </div>

        {/* Decorative illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute right-8 top-1/2 -translate-y-1/2 w-80 h-80 opacity-20 dark:opacity-10"
        >
          <div className="relative w-full h-full">
            {/* Abstract shapes */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4318ff] to-[#6b46ff] rounded-3xl opacity-30"
            />
            <motion.div
              animate={{
                y: [0, 20, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute bottom-0 right-16 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute top-1/2 right-8 w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl opacity-25"
            />
          </div>
        </motion.div>

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-50/30 to-blue-50/30 dark:via-purple-900/10 dark:to-blue-900/10" />
      </Card>
    </motion.div>
  );
}
