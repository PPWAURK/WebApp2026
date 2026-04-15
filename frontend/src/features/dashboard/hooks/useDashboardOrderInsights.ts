import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { AppText } from '../../../locales/translations';
import {
  buildOrderBonUrl,
  fetchOrders,
  fetchOrderReturns,
  fetchTopOrderedProductMonths,
  fetchTopOrderedProductsBySupplier,
  type OrderReturnSummary,
  type OrderSummary,
  type TopOrderedProduct,
} from '../../../services/ordersApi';
import {
  fetchSuppliers,
  type SupplierItem,
} from '../../../services/suppliersApi';
import { canEmbedWebDocument } from '../lib/dashboardShared';

type UseDashboardOrderInsightsArgs = {
  accessToken: string;
  isSupervisor: boolean;
  restaurantId?: number;
  text: AppText;
};

export function useDashboardOrderInsights({
  accessToken,
  isSupervisor,
  restaurantId,
  text,
}: UseDashboardOrderInsightsArgs) {
  const [latestOrder, setLatestOrder] = useState<OrderSummary | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [topProducts, setTopProducts] = useState<TopOrderedProduct[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [topProductsError, setTopProductsError] = useState<string | null>(null);
  const [recentReturns, setRecentReturns] = useState<OrderReturnSummary[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsError, setReturnsError] = useState<string | null>(null);
  const [chartSuppliers, setChartSuppliers] = useState<SupplierItem[]>([]);
  const [selectedChartSupplierId, setSelectedChartSupplierId] = useState<
    number | null
  >(null);
  const [chartMonths, setChartMonths] = useState<string[]>([]);
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(
    null,
  );
  const [orderPreviewUrl, setOrderPreviewUrl] = useState<string | null>(null);
  const [orderPreviewLoading, setOrderPreviewLoading] = useState(false);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);
  const [selectedReturnForPhotos, setSelectedReturnForPhotos] =
    useState<OrderReturnSummary | null>(null);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    let isActive = true;
    setOrderLoading(true);
    setOrderError(null);

    void fetchOrders(accessToken, restaurantId ? { restaurantId } : undefined)
      .then((orders) => {
        if (isActive) {
          setLatestOrder(orders[0] ?? null);
        }
      })
      .catch(() => {
        if (isActive) {
          setOrderError(text.dashboard.quickLoadOrderError);
          setLatestOrder(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setOrderLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isSupervisor, restaurantId, text.dashboard.quickLoadOrderError]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    let isActive = true;
    setReturnsLoading(true);
    setReturnsError(null);

    void fetchOrderReturns(accessToken, restaurantId ? { restaurantId } : undefined)
      .then((result) => {
        if (isActive) {
          setRecentReturns(result);
        }
      })
      .catch(() => {
        if (isActive) {
          setReturnsError(text.dashboard.returnSummaryLoadError);
          setRecentReturns([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setReturnsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isSupervisor, restaurantId, text.dashboard.returnSummaryLoadError]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    let isActive = true;

    void fetchSuppliers(accessToken)
      .then((result) => {
        if (!isActive) {
          return;
        }

        setChartSuppliers(result);
        setSelectedChartSupplierId((current) => {
          if (current && result.some((supplier) => supplier.id === current)) {
            return current;
          }

          return result[0]?.id ?? null;
        });
      })
      .catch(() => {
        if (isActive) {
          setChartSuppliers([]);
          setSelectedChartSupplierId(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isSupervisor]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    if (!selectedChartSupplierId) {
      setChartMonths([]);
      setSelectedChartMonth(null);
      return;
    }

    let isActive = true;

    void fetchTopOrderedProductMonths(accessToken, selectedChartSupplierId, restaurantId)
      .then((months) => {
        if (!isActive) {
          return;
        }

        setChartMonths(months);
        setSelectedChartMonth((current) => {
          if (current && months.includes(current)) {
            return current;
          }

          return months[0] ?? null;
        });
      })
      .catch(() => {
        if (isActive) {
          setChartMonths([]);
          setSelectedChartMonth(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, isSupervisor, restaurantId, selectedChartSupplierId]);

  useEffect(() => {
    if (!isSupervisor) {
      return;
    }

    if (!selectedChartSupplierId || !selectedChartMonth) {
      setTopProducts([]);
      setTopProductsError(null);
      setTopProductsLoading(false);
      return;
    }

    let isActive = true;
    setTopProductsLoading(true);
    setTopProductsError(null);

    void fetchTopOrderedProductsBySupplier(
      accessToken,
      selectedChartSupplierId,
      selectedChartMonth,
      restaurantId,
    )
      .then((result) => {
        if (isActive) {
          setTopProducts(result);
        }
      })
      .catch(() => {
        if (isActive) {
          setTopProductsError(text.dashboard.topProductsLoadError);
          setTopProducts([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setTopProductsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    accessToken,
    isSupervisor,
    restaurantId,
    selectedChartMonth,
    selectedChartSupplierId,
    text.dashboard.topProductsLoadError,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (!latestOrder) {
      setOrderPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
      return;
    }

    let isActive = true;
    setOrderPreviewLoading(true);

    void fetch(buildOrderBonUrl(latestOrder.id), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('ORDER_PREVIEW_FAILED');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setOrderPreviewUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          return objectUrl;
        });
      })
      .catch(() => {
        if (isActive) {
          setOrderPreviewUrl((currentUrl) => {
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }
            return null;
          });
        }
      })
      .finally(() => {
        if (isActive) {
          setOrderPreviewLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, latestOrder]);

  function openOrderPreview() {
    if (!orderPreviewUrl) {
      return;
    }

    if (!canEmbedWebDocument(orderPreviewUrl)) {
      void Linking.openURL(orderPreviewUrl);
      return;
    }

    setIsOrderPreviewOpen(true);
  }

  function closeOrderPreview() {
    setIsOrderPreviewOpen(false);
  }

  function openReturnPhotos(entry: OrderReturnSummary) {
    const hasPhotos = entry.items.some((item) => item.photos.length > 0);
    if (!hasPhotos) {
      return;
    }

    setSelectedReturnForPhotos(entry);
  }

  function closeReturnPhotos() {
    setSelectedReturnForPhotos(null);
  }

  return {
    chartMonths,
    chartSuppliers,
    closeOrderPreview,
    closeReturnPhotos,
    isOrderPreviewOpen,
    isReturnPhotosOpen: selectedReturnForPhotos !== null,
    latestOrder,
    openReturnPhotos,
    openOrderPreview,
    orderError,
    orderLoading,
    orderPreviewLoading,
    orderPreviewUrl,
    recentReturns,
    returnsError,
    returnsLoading,
    selectedReturnForPhotos,
    selectedChartMonth,
    selectedChartSupplierId,
    setSelectedChartMonth,
    setSelectedChartSupplierId,
    topProducts,
    topProductsError,
    topProductsLoading,
  };
}
