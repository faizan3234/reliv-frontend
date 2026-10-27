export const MAX_ORDER_UNITS = 10;
export const medicineUnitCount = cart => cart.reduce((sum,item)=>sum+(Number.isSafeInteger(item.cartQuantity)?item.cartQuantity:0),0);
export const dispenseLimitCopy = {
 en:'Up to 10 medicine units per order. This keeps dispensing within the device time limit.',
 hi:'एक ऑर्डर में ज़्यादा से ज़्यादा 10 दवाएँ लें, ताकि मशीन समय पर दे सके।',
 bn:'এক অর্ডারে সর্বোচ্চ ১০টি ওষুধ নিন, যাতে মেশিন সময়মতো দিতে পারে।',
};
