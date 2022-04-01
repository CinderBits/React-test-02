import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');
   if (storagedCart) {
        return JSON.parse(storagedCart);
    }

    return [];
  });


  useEffect(()=>{
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  },[cart])

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`/stock/${productId}`);
      const newProduct = await api.get(`/products/${productId}`);
      
      const productIn= cart.find(product=>product.id === productId);

      const currentAmount = productIn? productIn.amount : 0;

      if(stock.data.amount <= currentAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productIn){
        const newCart = cart.map((product)=>{
          if (product.id===productId){
            product.amount += 1;
            return product;
          }else{
            return product
          }
        })
        setCart(newCart)

      }
      else if(!productIn){
        const newAmount = currentAmount+1;
        const testing  =  setCart([...cart,{...newProduct.data,amount:newAmount}]);
        console.log('test',productIn);

      }
    } catch (x){
      // TODO
      console.log(x)
      toast.error('Erro na adição do produto');

    }
  };

  const removeProduct = async (productId: number) => {
    try {
      
      const newCart =  cart.filter(product=>productId !== product.id)
      
      setCart(newCart)
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get(`/stock/${productId}`);
      const newProduct = await api.get(`/products/${productId}`);
      
      const productIn= cart.find(product=>product.id === productId);

      console.log(stock.data.amount+','+amount)
      if(stock.data.amount < amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      if(productIn){
       const newCart= cart.map((product)=>{
        if (product.id===productId){
          product.amount = amount;
          return product;
        }else{
          return product
        }
       })
       setCart(newCart)
       
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
