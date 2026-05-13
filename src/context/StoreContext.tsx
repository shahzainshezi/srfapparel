"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  selectedSize?: string;
  selectedColor?: string;
  cartItemId: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: number;
  details?: any;
  employee_id?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  balance: number;
  site: string;
  role: string; // 'super_admin' | 'employee'
}

interface StoreContextType {
  credits: number;
  cart: CartItem[];
  addToCart: (product: any, selectedSize?: string, selectedColor?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  cartTotal: number;
  checkout: (deliveryInfo?: any) => Promise<boolean>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // AUTH
  currentUser: Employee | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<Employee | null>;
  resetPassword: (email: string, employeeId: string, newPassword: string) => Promise<boolean>;
  logout: () => void;

  // LIVE DATA EXPORTS
  globalProducts: any[];
  categories: any[];
  addProduct: (product: any, imageFile?: File) => Promise<void>;
  editProduct: (id: number, product: any, imageFile?: File) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  editCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  employees: Employee[];
  updateEmployeeBalance: (id: string, newBalance: number) => Promise<void>;
  issueAnnualBucks: () => Promise<void>;
  addEmployee: (emp: { name: string; email: string; password: string; site: string; balance: number }) => Promise<void>;
  editEmployee: (id: string, empData: any) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  orders: Order[];
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- Live Data States ---
  const [credits, setCredits] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Load auth from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem('srf_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setCredits(user.balance);
      } catch {
        localStorage.removeItem('srf_user');
      }
    }
    setIsAuthLoading(false);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, employeesRes, ordersRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('employees').select('*').order('created_at', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false })
      ]);

      if (productsRes.data) setGlobalProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (employeesRes.data) {
        setEmployees(employeesRes.data);
        // Sync balance from DB for logged-in user
        const savedUser = localStorage.getItem('srf_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          const freshUser = employeesRes.data.find((e: Employee) => e.id === user.id);
          if (freshUser) {
            setCredits(freshUser.balance);
            setCurrentUser(freshUser);
            localStorage.setItem('srf_user', JSON.stringify(freshUser));
          }
        }
      }
      if (ordersRes.data) {
        const formattedOrders = ordersRes.data.map((o: any) => ({
          id: o.id,
          date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          total: o.total_bucks,
          status: o.status,
          items: o.items_count,
          details: o.details,
          employee_id: o.employee_id
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- AUTH FUNCTIONS ---
  const login = async (email: string, password: string): Promise<Employee | null> => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) return null;

      const user: Employee = {
        id: data.id,
        name: data.name,
        email: data.email,
        balance: data.balance,
        site: data.site,
        role: data.role || 'employee'
      };
      setCurrentUser(user);
      setCredits(user.balance);
      localStorage.setItem('srf_user', JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  };

  const resetPassword = async (email: string, employeeId: string, newPassword: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .eq('id', employeeId)
        .single();

      if (error || !data) return false;

      const { error: updateError } = await supabase
        .from('employees')
        .update({ password: newPassword })
        .eq('id', employeeId);

      if (updateError) return false;
      
      // Update local state if the user being reset is the current user
      if (currentUser && currentUser.id === employeeId) {
        setCurrentUser({ ...currentUser, password: newPassword } as any);
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCredits(0);
    setCart([]);
    localStorage.removeItem('srf_user');
    localStorage.removeItem('srf_cart');
  };

  // Keep cart in localStorage
  useEffect(() => {
    if (isMounted && cart.length > 0) {
      localStorage.setItem('srf_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  useEffect(() => {
    if (isMounted) {
      const savedCart = localStorage.getItem('srf_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  }, [isMounted]);

  // --- CART FUNCTIONS ---
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const addToCart = (product: any, selectedSize?: string, selectedColor?: string) => {
    setCart((prevCart) => {
      const cartItemId = `${product.id}-${selectedSize || 'nosize'}-${selectedColor || 'nocolor'}`;
      const existing = prevCart.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prevCart.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1, selectedSize, selectedColor, cartItemId }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const checkout = async (deliveryInfo?: any) => {
    if (!currentUser) return false;
    if (cartTotal <= credits && cart.length > 0) {
      const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
      const newBalance = credits - cartTotal;

      await supabase.from('employees').update({ balance: newBalance }).eq('id', currentUser.id);
      
      const insertData: any = {
        id: newOrderId,
        employee_id: currentUser.id,
        total_bucks: cartTotal,
        status: 'Processing',
        items_count: itemsCount,
      };

      if (deliveryInfo || cart.length > 0) {
        insertData.details = { deliveryInfo, cart };
      }

      await supabase.from('orders').insert([insertData]);

      setCredits(newBalance);
      const updatedUser = { ...currentUser, balance: newBalance };
      setCurrentUser(updatedUser);
      localStorage.setItem('srf_user', JSON.stringify(updatedUser));
      setEmployees(prev => prev.map(emp => emp.id === currentUser.id ? { ...emp, balance: newBalance } : emp));

      const newOrderLocal = {
        id: newOrderId,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        total: cartTotal,
        status: 'Processing',
        items: itemsCount,
        details: { deliveryInfo, cart },
        employee_id: currentUser.id
      };
      setOrders(prev => [newOrderLocal, ...prev]);

      setCart([]);
      localStorage.removeItem('srf_cart');
      setIsCartOpen(false);
      return true;
    }
    return false;
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // --- ADMIN FUNCTIONS ---
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const addCategory = async (name: string) => {
    const { data } = await supabase.from('categories').insert([{ name }]).select();
    if (data) setCategories(prev => [...prev, data[0]]);
  };

  const editCategory = async (id: number, name: string) => {
    const { data } = await supabase.from('categories').update({ name }).eq('id', id).select();
    if (data) setCategories(prev => prev.map(c => c.id === id ? data[0] : c));
  };

  const deleteCategory = async (id: number) => {
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addProduct = async (productData: any, imageFile?: File) => {
    let imageUrl = productData.image;
    if (imageFile) imageUrl = await uploadImage(imageFile);
    const { data, error } = await supabase.from('products').insert([{
      title: productData.title,
      price: productData.price,
      description: productData.desc,
      image: imageUrl,
      is_top_pick: productData.isTopPick,
      category_id: productData.categoryId || null,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      gallery: productData.gallery || []
    }]).select('*, category:categories(name)');
    if (error) throw error;
    if (data) setGlobalProducts(prev => [data[0], ...prev]);
  };

  const editProduct = async (id: number, updatedData: any, imageFile?: File) => {
    let imageUrl = updatedData.image;
    if (imageFile) imageUrl = await uploadImage(imageFile);
    const { data, error } = await supabase.from('products').update({
      title: updatedData.title,
      price: updatedData.price,
      description: updatedData.desc,
      image: imageUrl,
      is_top_pick: updatedData.isTopPick,
      category_id: updatedData.categoryId || null,
      sizes: updatedData.sizes || [],
      colors: updatedData.colors || [],
      gallery: updatedData.gallery || []
    }).eq('id', id).select('*, category:categories(name)');
    if (error) throw error;
    if (data) setGlobalProducts(prev => prev.map(p => p.id === id ? data[0] : p));
  };

  const deleteProduct = async (id: number) => {
    await supabase.from('products').delete().eq('id', id);
    setGlobalProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateEmployeeBalance = async (id: string, newBalance: number) => {
    await supabase.from('employees').update({ balance: newBalance }).eq('id', id);
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, balance: newBalance } : emp));
    if (currentUser && id === currentUser.id) {
      setCredits(newBalance);
      const updatedUser = { ...currentUser, balance: newBalance };
      setCurrentUser(updatedUser);
      localStorage.setItem('srf_user', JSON.stringify(updatedUser));
    }
  };

  const issueAnnualBucks = async () => {
    await supabase.from('employees').update({ balance: 250 }).neq('id', '');
    setEmployees(prev => prev.map(emp => ({ ...emp, balance: 250 })));
    if (currentUser) {
      setCredits(250);
      const updatedUser = { ...currentUser, balance: 250 };
      setCurrentUser(updatedUser);
      localStorage.setItem('srf_user', JSON.stringify(updatedUser));
    }
  };

  const addEmployee = async (empData: { name: string; email: string; password: string; site: string; balance: number }) => {
    // Safely generate employee ID by finding the highest existing ID number
    const maxIdNum = employees.reduce((max, emp) => {
      const match = emp.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const newId = `EMP-${String(maxIdNum + 1).padStart(3, '0')}`;
    
    const insertData: any = {
      id: newId,
      name: empData.name,
      email: empData.email,
      password: empData.password,
      balance: empData.balance,
      role: 'employee'
    };
    // site column add only if provided (might not exist in older schemas)
    if (empData.site) insertData.site = empData.site;
    
    const { data, error } = await supabase.from('employees').insert([insertData]).select();
    if (error) throw error;
    if (data) setEmployees(prev => [...prev, data[0]]);
  };

  const editEmployee = async (id: string, empData: any) => {
    const updateData: any = {
      name: empData.name,
      email: empData.email,
      balance: empData.balance,
    };
    if (empData.site) updateData.site = empData.site;
    if (empData.password) updateData.password = empData.password; // Note: Only updates password if provided
    if (empData.role) updateData.role = empData.role;

    const { data, error } = await supabase.from('employees').update(updateData).eq('id', id).select();
    if (error) throw error;
    
    if (data) {
      setEmployees(prev => prev.map(e => e.id === id ? data[0] : e));
      if (currentUser && id === currentUser.id) {
        setCredits(empData.balance);
        const updatedUser = { ...currentUser, ...updateData };
        setCurrentUser(updatedUser);
        localStorage.setItem('srf_user', JSON.stringify(updatedUser));
      }
    }
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  if (!isMounted) return null;

  return (
    <StoreContext.Provider
      value={{
        credits,
        cart,
        addToCart,
        removeFromCart,
        cartTotal,
        checkout,
        isCartOpen,
        setIsCartOpen,
        currentUser,
        isAuthLoading,
        login,
        resetPassword,
        logout,
        globalProducts,
        categories,
        addProduct,
        editProduct,
        deleteProduct,
        addCategory,
        editCategory,
        deleteCategory,
        employees,
        updateEmployeeBalance,
        issueAnnualBucks,
        addEmployee,
        editEmployee,
        deleteEmployee,
        orders,
        updateOrderStatus
      }}
    >
      {isLoading ? (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a' }}>
          <div className="circle-animation" style={{ width: '50px', height: '50px' }}></div>
        </div>
      ) : children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
