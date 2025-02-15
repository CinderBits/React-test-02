import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
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

  const prevCartRef = useRef<Product[]>()



  useEffect(()=>{
    prevCartRef.current = cart;    
  },[])

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(()=>{
    if (cartPreviousValue !== cart){
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))
    } 
  },[cart, cartPreviousValue])


  const addProduct = async (productId: number) => {
    try {

      const tempCart = [...cart]
      const productIn = tempCart.find(product=> product.id === productId)
      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount
      const currentAmount = productIn? productIn.amount : 0
      const newAmount = currentAmount + 1

      if( newAmount > stockAmount) {
         toast.error('Quantidade solicitada fora de estoque');
         return
      }

      if(productIn){
        productIn.amount= newAmount
        
      }else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {...product.data, amount:newAmount};
        
        tempCart.push(newProduct)
      }
      setCart(tempCart)


    } catch (x){
      toast.error('Erro na adição do produto');

    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const tempCart = [...cart]
      const Index =cart.findIndex((product)=> product.id === productId)
      if(Index>=0) {
        const newCart =  tempCart.splice(Index,1)
        setCart(tempCart)
        
      }
      else{
        toast.error('Erro na remoção do produto');
        return
      }
    } catch {
        toast.error('Erro na remoção do produto');
    }

  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount<1){
        toast.error('Erro na alteração de quantidade do produto');
        return}
      const stock = await api.get(`/stock/${productId}`)
      
      if(stock.data.amount < amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
     }
     const tempCart = [...cart]

      const productIn= tempCart.find(product=>product.id === productId);

          if(productIn){
                productIn.amount= amount
                setCart(tempCart)
          }else{
            throw Error()
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
