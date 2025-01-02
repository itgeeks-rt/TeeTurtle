import {
    Scrollable,
    EmptySearchResult,
    Box,
    TextField,
    Text,
    Spinner,
    Thumbnail,
    InlineStack,
    Pagination,
    Button,
    Icon,
    IndexTable,
    useIndexResourceState,
    useBreakpoints,
    Popover,
    ChoiceList,
    AppProvider,
    Badge
} from "@shopify/polaris";
import '../assets/styles.css';
import { useAppBridge } from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect, Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, SearchIcon } from '@shopify/polaris-icons';

export default function FetchProduct({ selectedTemplates }) {
    const { t } = useTranslation();
    const shopify = useAppBridge();

    const [fetchProducts, setFetchProducts] = useState([]);
    const [productVariants, setProductVariants] = useState([]);
    const [pagination, setPagination] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [loadingSpinner, setLoadingSpinner] = useState(false);
    const [buttonUploadLoading, setButtonUploadLoading] = useState(false);
    const [sortByPopoverActive, setSortByPopoverActive] = useState(false);
    const [selectedSortByChoice, setSelectedSortByChoice] = useState(['empty']);
    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const [requestBody, setRequestBody] = useState({
        searchQuery: '',
        sortBy: '',
        cursorAfter: '',
        cursorBefore: '',
    });

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    // Fetch product data
    useEffect(() => {
        setLoadingSpinner(true);
        fetch(`${variable.baseUrl}/external/product/productList?shop=${variable.shopUrl}`, {
            method: "POST",
            headers: myHeaders,
            redirect: 'follow',
            body: JSON.stringify(requestBody)
        })
        .then((res) => res.json())
        .then((data) => {
            const pagination = data?.result.data.products.pageInfo || [];
            const items = data?.result.data.products.edges || [];
            //console.log(items)
            setPagination(pagination);
            setFetchProducts(items);
            setLoadingSpinner(false);
            if (items) {
                items.map((item) => {
                    let variants = item.node?.variants?.edges;
                    if (variants) {
                        variants.map((variant) => {
                            setProductVariants((prevVariants) => [
                                ...prevVariants,
                                variant.node,
                            ]);
                        });
                    }
                })
            }
        })
        .catch((err) => {
            shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
            console.error(err);
        });
    }, [requestBody]);

    // Handle search input change
    const handleSearchChange = (value) => {
        setSearchValue(value);
         if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
        const timeout = setTimeout(() => {
            const updatedRequestBody = {
                cursorAfter: "",
                cursorBefore: "",
                ...(value && value.length >= 0 ? { searchQuery: value } : {}),
            };
            setRequestBody(updatedRequestBody);
        }, 300);
        setDebounceTimeout(timeout);
    };

    /* Sort by */
    const toggleSortByPopoverActive = useCallback(() => setSortByPopoverActive((sortByPopoverActive) => !sortByPopoverActive),[],);
    const handleSortByChange = useCallback((value) => {
        setSelectedSortByChoice(value), [];
        setRequestBody({ cursorAfter: '', cursorBefore: '', searchQuery: searchValue, sortBy: value[0] });
    });
    const sortByPopupButton = (
        <Button onClick={toggleSortByPopoverActive} disclosure size="large">Sort by product</Button>
    );

    const [selectedItems, setSelectedItems] = useState([]);

    const UploadImageToPrducts = (selectedTemplates, selectedItems) => {
        setButtonUploadLoading(true);
        const postRequestData = {
            productIdList: selectedItems,
            imageUrlList: selectedTemplates
        };
        fetch(`${variable.baseUrl}/external/product/uploadProductImage?shop=${variable.shopUrl}`, {
            method: "POST",
            headers: myHeaders,
            redirect: 'follow',
            body: JSON.stringify(postRequestData)
        })
        .then((res) => res.json())
        .then((data) => {
            if (data && data.status) {
                shopify.toast.show('Image Uploaded successfully.');
            } else if (data && data.message) {
                shopify.toast.show(data.message, { isError: true, });
            }
            setButtonUploadLoading(false);
        })
        .catch((err) => {
            shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
            console.error(err)
            setButtonUploadLoading(false);
        });
    }

    const groupProducts = () => {
        const result = {};
        let position = 0;
        fetchProducts.forEach((product) => {
            const title = product.node.title;
            if (!result[title]) {
                result[title] = {
                    position: position++,
                    id: product.node.id,
                    title: product.node.title,
                    featuredMedia: product.node.featuredMedia,
                    variants: [],
                };
            }
            const variants = product.node.variants.edges.map((edge) => ({
                id: edge.node.id,
                title: edge.node.title,
                image: edge.node.image,
                mediaId: edge.node.media?.edges[0]?.node.id,
                position: position++,
            }));

            result[title].variants.push(...variants);
        });
        return result;
    };

    const resourceName = {
        singular: 'image selection product',
        plural: 'image selection products',
    };

    const { selectedResources, handleSelectionChange } =
        useIndexResourceState(productVariants.map((row) => ({ ...row })), {
            resourceFilter: ({ disabled }) => !disabled,
        });


    const groupedProducts = groupProducts();

    useEffect(() => {
        const updatedSelectedItems = Object.keys(groupedProducts).reduce((productArray, item) => {
            const { variants, id: productId } = groupedProducts[item];
            const selectedVariants = variants.filter(({ id }) => selectedResources.includes(id));
            if (selectedVariants.length > 0) {
                if (selectedTemplates.length === 1) {
                    productArray.push({
                        productId: productId,
                        variantsIds: selectedVariants.map(({ id, mediaId }) => id+'__'+mediaId),
                    });
                } else {
                    productArray.push({
                        productId: productId,
                    });
                }
            }
            return productArray;
        }, []);
        setSelectedItems(updatedSelectedItems);
    }, [selectedResources]);

    const rowMarkup = Object.keys(groupedProducts).map((item, index) => {
        const { variants, position, id: productId, featuredMedia = {} } = groupedProducts[item];
        let selected = false;

        const someProductsSelected = variants.some(({ id }) =>
            selectedResources.includes(id)
        );

        const allProductsSelected = variants.every(({ id }) => {
            selectedResources.includes(id)
        });

        if (allProductsSelected) {
            selected = true;
        } else if (someProductsSelected) {
            selected = true;
        }


        const selectableRows = productVariants.filter(({ disabled }) => !disabled);
        const rowRange = [
            selectableRows.findIndex((row) => row.id === variants[0].id),
            selectableRows.findIndex(
                (row) => row.id === variants[variants.length - 1].id
            ),
        ];

        return (
            <Fragment key={productId}>
                <IndexTable.Row
                    rowType="data"
                    selectionRange={rowRange}
                    id={`Parent-${index}`}
                    position={position}
                    selected={selected}
                    accessibilityLabel={`Select all products which have variants ${item}`}
                >
                    <IndexTable.Cell scope="col" id={productId}>
                        <InlineStack align="start" gap="500" blockAlign="center">
                            <Thumbnail
                                source={featuredMedia?.preview?.image?.url || ImageIcon}
                                size="small"
                                alt={item || ""}
                            />
                            <Text as="span" fontWeight="semibold">{item}</Text>
                        </InlineStack>
                    </IndexTable.Cell>
                </IndexTable.Row>
                {selectedTemplates.length === 1 && variants.map(({ id, position, title }, rowIndex) => (
                    <IndexTable.Row
                        rowType="child"
                        key={rowIndex}
                        id={id}
                        position={position}
                        selected={selectedResources.includes(id)}
                    >
                        <IndexTable.Cell>
                            <Text variant="bodyMd" as="span">
                                {title}
                            </Text>
                        </IndexTable.Cell>
                    </IndexTable.Row>
                ))}
            </Fragment>
        );
    });


    return (
        <AppProvider i18n={{}}>
            <Box padding={{ xs: '0', sm: '0' }}>
                <Box className="searchbar-with__filters" padding={{ xs: '400', sm: '400' }} borderBlockEndWidth="0165" borderColor="border-brand">
                    <TextField
                        prefix={<Icon source={SearchIcon} />}
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Search products"
                        clearButton
                        onClearButtonClick={() => handleSearchChange("")}
                    />
                    <Popover
                        active={sortByPopoverActive}
                        activator={sortByPopupButton}
                        autofocusTarget="first-node" 
                        onClose={toggleSortByPopoverActive}
                    >
                        <Box className="sort-by__products">
                            <ChoiceList
                                choices={[
                                    {label: 'Barcode', value: 'barcode'},
                                    {label: 'SKU', value: 'sku'},
                                    {label: 'Variant Id', value: 'variant_id'},
                                    {label: 'Variant Title', value: 'variant_title'},
                                ]}
                                selected={selectedSortByChoice}
                                onChange={handleSortByChange}
                            />
                            {selectedSortByChoice != 'empty' && (
                                <Button variant="plain" onClick={() => setSelectedSortByChoice('empty')}>Clear</Button>
                            )}
                        </Box>
                    </Popover>
                </Box>
                {selectedSortByChoice != 'empty' && ( 
                    <Box paddingBlockEnd="400" paddingInlineStart="400">
                        <InlineStack gap='200'>
                            <Badge>Sort By product: {selectedSortByChoice[0].replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</Badge>
                        </InlineStack>
                    </Box>
                )}
                <Scrollable style={{ height: '400px' }}>
                    <Box position="relative">
                        <IndexTable
                            emptyState
                            condensed={useBreakpoints().smDown}
                            onSelectionChange={handleSelectionChange}
                            resourceName={resourceName}
                            itemCount={fetchProducts.length}
                            headings={[]}
                        >
                            {rowMarkup}
                        </IndexTable>
                    </Box>
                    {loadingSpinner ? (
                        <Box as="span" className="box-center__center" position="absolute" zIndex="1">
                            <Spinner accessibilityLabel="Loading Spinner" size="large" />
                        </Box>
                    ) : fetchProducts.length === 0 && (
                        <Box as="div" className="box-center__center" position="absolute" zIndex="1">
                            <EmptySearchResult
                                title="No Products Found"
                                description="Try changing the filters or search term."
                                withIllustration
                            />
                        </Box>
                    )}
                </Scrollable>
                <Box padding={{ xs: '400', sm: '400' }} borderBlockStartWidth="0165" borderColor="border-brand">
                    <InlineStack align="space-between">
                        <Pagination
                            label=""
                            hasPrevious={pagination.hasPreviousPage}
                            onPrevious={() => { setRequestBody({ ...requestBody, searchQuery: searchValue, sortBy: selectedSortByChoice[0], cursorAfter: '', cursorBefore: pagination.hasPreviousPage ? fetchProducts[0].cursor : '' }) }}
                            hasNext={pagination.hasNextPage}
                            onNext={() => { setRequestBody({ ...requestBody, searchQuery: searchValue, sortBy: selectedSortByChoice[0], cursorAfter: pagination.hasNextPage ? fetchProducts[fetchProducts.length - 1].cursor : '', cursorBefore: '' }) }}
                        />
                        <Button variant="primary" size="large" onClick={() => UploadImageToPrducts(selectedTemplates, selectedItems)} disabled={selectedItems.length > 0 ? false : true} loading={buttonUploadLoading}>Upload Images</Button>
                    </InlineStack>
                </Box>
            </Box>
        </AppProvider>
    );
}
