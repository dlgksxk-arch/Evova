package com.hamdeva.app;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.Bridge;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private final Map<String, ProductDetails> inAppProductCache = new HashMap<>();
    private final Map<String, ProductDetails> subsProductCache = new HashMap<>();

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases()
            .build();
        startConnection(null);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        ensureConnected(call, () -> {
            JSObject result = new JSObject();
            result.put("available", billingClient != null && billingClient.isReady());
            call.resolve(result);
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        String productType = normalizeProductType(call.getString("productType"));
        JSArray productIds = call.getArray("productIds");
        if (productType == null || productIds == null || productIds.length() == 0) {
            call.reject("Missing productIds or productType", "INVALID_INPUT");
            return;
        }

        ensureConnected(call, () -> queryProductDetails(productIds, productType, call));
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        String productType = normalizeProductType(call.getString("productType"));
        if (productId == null || productId.trim().isEmpty() || productType == null) {
            call.reject("Missing productId or productType", "INVALID_INPUT");
            return;
        }

        ensureConnected(call, () -> startPurchaseFlow(call, productId.trim(), productType));
    }

    @PluginMethod
    public void consumePurchase(PluginCall call) {
        String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null || purchaseToken.trim().isEmpty()) {
            call.reject("Missing purchaseToken", "INVALID_INPUT");
            return;
        }

        ensureConnected(call, () -> billingClient.consumeAsync(
            ConsumeParams.newBuilder().setPurchaseToken(purchaseToken.trim()).build(),
            (billingResult, outToken) -> {
                if (!isOk(billingResult)) {
                    call.reject(getBillingMessage(billingResult), String.valueOf(billingResult.getResponseCode()));
                    return;
                }
                JSObject result = new JSObject();
                result.put("consumed", true);
                result.put("purchaseToken", outToken);
                call.resolve(result);
            }
        ));
    }

    @PluginMethod
    public void acknowledgePurchase(PluginCall call) {
        String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null || purchaseToken.trim().isEmpty()) {
            call.reject("Missing purchaseToken", "INVALID_INPUT");
            return;
        }

        ensureConnected(call, () -> billingClient.acknowledgePurchase(
            AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchaseToken.trim()).build(),
            billingResult -> {
                if (!isOk(billingResult)) {
                    call.reject(getBillingMessage(billingResult), String.valueOf(billingResult.getResponseCode()));
                    return;
                }
                JSObject result = new JSObject();
                result.put("acknowledged", true);
                call.resolve(result);
            }
        ));
    }

    @Override
    public void handleOnDestroy() {
        if (billingClient != null) {
            billingClient.endConnection();
        }
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) {
            return;
        }

        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;

        if (!isOk(billingResult)) {
            String errorCode = billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED
                ? "USER_CANCELED"
                : String.valueOf(billingResult.getResponseCode());
            call.reject(getBillingMessage(billingResult), errorCode);
            bridge.releaseCall(call);
            return;
        }

        if (purchases == null || purchases.isEmpty()) {
            call.reject("No purchase returned", "EMPTY_PURCHASE");
            bridge.releaseCall(call);
            return;
        }

        call.resolve(toPurchaseResult(purchases.get(0)));
        bridge.releaseCall(call);
    }

    private void startConnection(Runnable onConnected) {
        if (billingClient == null) {
            return;
        }
        if (billingClient.isReady()) {
            if (onConnected != null) {
                onConnected.run();
            }
            return;
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (isOk(billingResult) && onConnected != null) {
                    onConnected.run();
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Reconnect on the next request.
            }
        });
    }

    private void ensureConnected(PluginCall call, Runnable onConnected) {
        if (billingClient == null) {
            call.unavailable("Billing client is not initialized");
            return;
        }
        if (billingClient.isReady()) {
            onConnected.run();
            return;
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (!isOk(billingResult)) {
                    call.reject(getBillingMessage(billingResult), String.valueOf(billingResult.getResponseCode()));
                    return;
                }
                onConnected.run();
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Ignore and let the next attempt reconnect.
            }
        });
    }

    private void queryProductDetails(JSArray productIds, String productType, PluginCall call) {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (int i = 0; i < productIds.length(); i++) {
            String productId = productIds.optString(i, "").trim();
            if (!productId.isEmpty()) {
                products.add(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(productType)
                        .build()
                );
            }
        }

        if (products.isEmpty()) {
            call.reject("No valid productIds provided", "INVALID_INPUT");
            return;
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
            if (!isOk(billingResult)) {
                call.reject(getBillingMessage(billingResult), String.valueOf(billingResult.getResponseCode()));
                return;
            }

            List<ProductDetails> productDetailsList = productDetailsResult == null
                ? new ArrayList<>()
                : productDetailsResult.getProductDetailsList();
            JSArray items = new JSArray();
            Map<String, ProductDetails> cache = getProductCache(productType);
            cache.clear();
            for (ProductDetails details : productDetailsList) {
                cache.put(details.getProductId(), details);
                items.put(toProductResult(details, productType));
            }

            JSObject result = new JSObject();
            result.put("products", items);
            call.resolve(result);
        });
    }

    private void queryProductDetails(
        List<String> productIds,
        String productType,
        ProductDetailsListCallback callback,
        PluginCall call
    ) {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String productId : productIds) {
            if (productId != null && !productId.trim().isEmpty()) {
                products.add(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId.trim())
                        .setProductType(productType)
                        .build()
                );
            }
        }

        if (products.isEmpty()) {
            call.reject("No valid productIds provided", "INVALID_INPUT");
            return;
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
            if (!isOk(billingResult)) {
                call.reject(getBillingMessage(billingResult), String.valueOf(billingResult.getResponseCode()));
                return;
            }

            List<ProductDetails> productDetailsList = productDetailsResult == null
                ? new ArrayList<>()
                : productDetailsResult.getProductDetailsList();
            Map<String, ProductDetails> cache = getProductCache(productType);
            cache.clear();
            for (ProductDetails details : productDetailsList) {
                cache.put(details.getProductId(), details);
            }
            callback.onProducts(productDetailsList);
        });
    }

    private void startPurchaseFlow(PluginCall call, String productId, String productType) {
        String offerToken = call.getString("offerToken");
        String obfuscatedAccountId = call.getString("obfuscatedAccountId");
        querySingleProduct(productId, productType, details -> {
            BillingFlowParams.ProductDetailsParams.Builder productParamsBuilder =
                BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details);

            if (BillingClient.ProductType.SUBS.equals(productType)) {
                String resolvedOfferToken = resolveOfferToken(details, offerToken);
                if (resolvedOfferToken == null || resolvedOfferToken.isEmpty()) {
                    call.reject("No subscription offer is available for this product", "NO_OFFER");
                    return;
                }
                productParamsBuilder.setOfferToken(resolvedOfferToken);
                launchSubscriptionFlow(call, details, productParamsBuilder.build(), obfuscatedAccountId);
                return;
            }

            launchBillingFlow(call, productParamsBuilder.build(), obfuscatedAccountId, null);
        }, call);
    }

    private void launchSubscriptionFlow(
        PluginCall call,
        ProductDetails details,
        BillingFlowParams.ProductDetailsParams productDetailsParams,
        String obfuscatedAccountId
    ) {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
            (billingResult, purchases) -> {
                if (!isOk(billingResult)) {
                    call.reject(getBillingMessage(billingResult), String.valueOf(billingResult.getResponseCode()));
                    return;
                }

                BillingFlowParams.SubscriptionUpdateParams subscriptionUpdateParams = null;
                if (purchases != null) {
                    for (Purchase purchase : purchases) {
                        if (purchase.getProducts().contains(details.getProductId())) {
                            break;
                        }
                        if (!purchase.getPurchaseToken().isEmpty()) {
                            subscriptionUpdateParams = BillingFlowParams.SubscriptionUpdateParams.newBuilder()
                                .setOldPurchaseToken(purchase.getPurchaseToken())
                                .setSubscriptionReplacementMode(BillingFlowParams.SubscriptionUpdateParams.ReplacementMode.CHARGE_FULL_PRICE)
                                .build();
                            break;
                        }
                    }
                }

                launchBillingFlow(call, productDetailsParams, obfuscatedAccountId, subscriptionUpdateParams);
            }
        );
    }

    private void launchBillingFlow(
        PluginCall call,
        BillingFlowParams.ProductDetailsParams productDetailsParams,
        String obfuscatedAccountId,
        BillingFlowParams.SubscriptionUpdateParams subscriptionUpdateParams
    ) {
        BillingFlowParams.Builder flowBuilder = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(java.util.Collections.singletonList(productDetailsParams));

        if (obfuscatedAccountId != null && !obfuscatedAccountId.trim().isEmpty()) {
            flowBuilder.setObfuscatedAccountId(obfuscatedAccountId.trim());
        }
        if (subscriptionUpdateParams != null) {
            flowBuilder.setSubscriptionUpdateParams(subscriptionUpdateParams);
        }

        pendingPurchaseCall = call;
        bridge.saveCall(call);

        BillingResult launchResult = billingClient.launchBillingFlow(getActivity(), flowBuilder.build());
        if (!isOk(launchResult)) {
            pendingPurchaseCall = null;
            bridge.releaseCall(call);
            String errorCode = launchResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED
                ? "USER_CANCELED"
                : String.valueOf(launchResult.getResponseCode());
            call.reject(getBillingMessage(launchResult), errorCode);
        }
    }

    private void querySingleProduct(String productId, String productType, ProductDetailsCallback callback, PluginCall call) {
        ProductDetails cached = getProductCache(productType).get(productId);
        if (cached != null) {
            callback.onProduct(cached);
            return;
        }
        List<String> productIds = new ArrayList<>();
        productIds.add(productId);
        queryProductDetails(productIds, productType, productDetailsList -> {
            ProductDetails details = getProductCache(productType).get(productId);
            if (details == null) {
                call.reject("Product not found", "PRODUCT_NOT_FOUND");
                return;
            }
            callback.onProduct(details);
        }, call);
    }

    private Map<String, ProductDetails> getProductCache(String productType) {
        return BillingClient.ProductType.SUBS.equals(productType) ? subsProductCache : inAppProductCache;
    }

    private String resolveOfferToken(ProductDetails details, String preferredToken) {
        if (details.getSubscriptionOfferDetails() == null || details.getSubscriptionOfferDetails().isEmpty()) {
            return null;
        }
        if (preferredToken != null && !preferredToken.trim().isEmpty()) {
            for (ProductDetails.SubscriptionOfferDetails offerDetails : details.getSubscriptionOfferDetails()) {
                if (preferredToken.equals(offerDetails.getOfferToken())) {
                    return preferredToken;
                }
            }
        }
        return details.getSubscriptionOfferDetails().get(0).getOfferToken();
    }

    private JSObject toProductResult(ProductDetails details, String productType) {
        JSObject result = new JSObject();
        result.put("productId", details.getProductId());
        result.put("productType", productType);
        result.put("title", details.getTitle());
        result.put("description", details.getDescription());

        String formattedPrice = null;
        String currencyCode = null;
        String priceAmountMicros = null;
        String offerToken = null;

        if (BillingClient.ProductType.SUBS.equals(productType)) {
            List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
            if (offers != null && !offers.isEmpty()) {
                ProductDetails.SubscriptionOfferDetails selectedOffer = offers.get(0);
                offerToken = selectedOffer.getOfferToken();
                if (selectedOffer.getPricingPhases() != null
                    && selectedOffer.getPricingPhases().getPricingPhaseList() != null
                    && !selectedOffer.getPricingPhases().getPricingPhaseList().isEmpty()) {
                    ProductDetails.PricingPhase phase = selectedOffer.getPricingPhases().getPricingPhaseList().get(0);
                    formattedPrice = phase.getFormattedPrice();
                    currencyCode = phase.getPriceCurrencyCode();
                    priceAmountMicros = String.valueOf(phase.getPriceAmountMicros());
                }
            }
        } else if (details.getOneTimePurchaseOfferDetails() != null) {
            ProductDetails.OneTimePurchaseOfferDetails offerDetails = details.getOneTimePurchaseOfferDetails();
            formattedPrice = offerDetails.getFormattedPrice();
            currencyCode = offerDetails.getPriceCurrencyCode();
            priceAmountMicros = String.valueOf(offerDetails.getPriceAmountMicros());
        }

        result.put("formattedPrice", formattedPrice);
        result.put("currencyCode", currencyCode);
        result.put("priceAmountMicros", priceAmountMicros);
        result.put("offerToken", offerToken);
        return result;
    }

    private JSObject toPurchaseResult(Purchase purchase) {
        JSObject result = new JSObject();
        JSArray products = new JSArray();
        for (String product : purchase.getProducts()) {
            products.put(product);
        }
        result.put("orderId", purchase.getOrderId());
        result.put("products", products);
        result.put("purchaseToken", purchase.getPurchaseToken());
        result.put("purchaseState", mapPurchaseState(purchase.getPurchaseState()));
        result.put("acknowledged", purchase.isAcknowledged());
        return result;
    }

    private String mapPurchaseState(int purchaseState) {
        if (purchaseState == Purchase.PurchaseState.PURCHASED) {
            return "PURCHASED";
        }
        if (purchaseState == Purchase.PurchaseState.PENDING) {
            return "PENDING";
        }
        return "UNSPECIFIED_STATE";
    }

    private boolean isOk(BillingResult billingResult) {
        return billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK;
    }

    private String getBillingMessage(BillingResult billingResult) {
        String message = billingResult.getDebugMessage();
        return message == null || message.isEmpty() ? "Billing request failed" : message;
    }

    private String normalizeProductType(String productType) {
        if ("subs".equals(productType) || BillingClient.ProductType.SUBS.equals(productType)) {
            return BillingClient.ProductType.SUBS;
        }
        if ("inapp".equals(productType) || BillingClient.ProductType.INAPP.equals(productType)) {
            return BillingClient.ProductType.INAPP;
        }
        return null;
    }

    private interface ProductDetailsCallback {
        void onProduct(ProductDetails details);
    }

    private interface ProductDetailsListCallback {
        void onProducts(List<ProductDetails> detailsList);
    }
}
