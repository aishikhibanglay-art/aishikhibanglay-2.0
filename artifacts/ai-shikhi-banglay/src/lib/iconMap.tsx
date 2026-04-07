import {
  BookOpen, Award, Users, Target, TrendingUp, Zap, GraduationCap,
  Shield, Headphones, Globe, Star, Clock, CheckCircle, Play, Heart,
  Code, Database, Brain, Lightbulb, Rocket, MessageSquare, FileText,
  BarChart, Laptop, Smartphone, Wifi, Lock, CreditCard, Mail,
  Youtube, Instagram, Facebook, Twitter, ChevronRight, ArrowRight,
  Flame, Trophy, Gift, Camera, Music, PenTool, Layers, Package
} from "lucide-react";

export const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Award, Users, Target, TrendingUp, Zap, GraduationCap,
  Shield, Headphones, Globe, Star, Clock, CheckCircle, Play, Heart,
  Code, Database, Brain, Lightbulb, Rocket, MessageSquare, FileText,
  BarChart, Laptop, Smartphone, Wifi, Lock, CreditCard, Mail,
  Youtube, Instagram, Facebook, Twitter, ChevronRight, ArrowRight,
  Flame, Trophy, Gift, Camera, Music, PenTool, Layers, Package
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] || BookOpen;
}
