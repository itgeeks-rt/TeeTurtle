import {
    Scrollable,
    EmptySearchResult,
    Thumbnail,
    Box,
    TextField,
    Text,
    Spinner,
    ResourceList, 
    ResourceItem,
    InlineStack,
    Pagination,
    Button
  } from "@shopify/polaris";
import '../assets/styles.css';
import {useAppBridge } from '@shopify/app-bridge-react';
import variable from '../Variable';
import { useState, useEffect} from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon } from '@shopify/polaris-icons';
 
export default function FetchProduct({selectedTemplates}) {
    const { t } = useTranslation();
    const shopify = useAppBridge(); 
    const baseUrl = variable.Base_Url;


    // State variables for managing images, pagination, form inputs, and loading states
    const [fetchProducts, setFetchProducts] = useState([]);
    const [pagination, setPagination] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [loadingSpinner, setLoadingSpinner] = useState(false);
    const [buttonUploadLoading, setButtonUploadLoading] = useState(false);
    const [requestBody, setRequestBody] = useState({
        searchQuery: '', 
        cursorAfter: '',
        cursorBefore: '',
    });
    
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    /* Fetch template images from the server using AJAX */
    useEffect(() => {
        setLoadingSpinner(true);
        fetch(`${baseUrl}/external/product/productList?shop=itgeeks-test.myshopify.com`, {
            method: "POST",
            headers: myHeaders,
            redirect: 'follow',
            body: JSON.stringify(requestBody)
        })
        .then((res) => res.json())
        .then((data) => {
            const pagination = data?.result.data.products.pageInfo || [];
            const items = data?.result.data.products.edges || [];
            setPagination(pagination);
            setFetchProducts(items);
            setLoadingSpinner(false);
        })
        .catch((err) => {
            shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
            console.error(err)
        });
    }, [requestBody]);


    /* Handle search input change and fetch updated list of images */
    const handleSearchChange = (value) => {
        setSearchValue(value);
        const updatedRequestBody = {
            cursorAfter: '',
            cursorBefore: '',
            ...(value && value.length >= 0 ? { searchQuery: value } : {}),
        };
        setRequestBody(updatedRequestBody);
    };

    const [selectedItems, setSelectedItems] = useState([]);

    const UploadImageToPrducts = (selectedTemplates,selectedItems) => {
        setButtonUploadLoading(true);
        const postRequestData = {
            productIdList: selectedItems, 
            imageUrlList: selectedTemplates
        }
        fetch(`${baseUrl}/external/product/uploadProductImage?shop=itgeeks-test.myshopify.com`, {
            method: "POST",
            headers: myHeaders,
            redirect: 'follow',
            body: JSON.stringify(postRequestData)
        })
        .then((res) => res.json())
        .then((data) => {
            if(data && data.status){  
                shopify.toast.show('Image Uploaded successfully.');
            }else if (data && data.message){
                shopify.toast.show(data.message, {isError: true,}); 
            }
            setButtonUploadLoading(false);
        })
        .catch((err) => {
            shopify.toast.show('Something went wrong. Please try again later.', { isError: true });
            console.error(err)
            setButtonUploadLoading(false);
        });
    }

    return (
        <Box padding={{ xs: '0', sm: '0' }}> 
            <Box padding={{ xs: '400', sm: '400' }} borderBlockEndWidth="0165" borderColor="border-brand">
                <TextField
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="Search products"
                    clearButton
                    onClearButtonClick={() => handleSearchChange("")}
                />

            </Box>
            <Scrollable style={{height: '400px'}}> 
                <Box position="relative">  
                    <ResourceList
                        resourceName={{ singular: 'product', plural: 'products' }}
                        items={fetchProducts.map(({ node: { id, title, featuredMedia = {} } }) => ({
                            id,
                            title,
                            imageUrl: featuredMedia?.preview?.image?.url || null,
                        }))}
                        selectedItems={selectedItems}
                        onSelectionChange={setSelectedItems}
                        selectable
                        renderItem={(item) => {
                            const { id, title, imageUrl } = item;
                            return (
                                <ResourceItem
                                    verticalAlignment="center"
                                    id={id}
                                    media={
                                        <Thumbnail
                                            source={imageUrl || ImageIcon}
                                            size="small"
                                            alt={title || ""}
                                        />
                                    }
                                    accessibilityLabel={`Select ${title}`}
                                    onClick={() => {
                                        setSelectedItems((prevSelected) => {
                                            if (prevSelected.includes(id)) {
                                                return prevSelected.filter((itemId) => itemId !== id);
                                            } else {
                                                return [...prevSelected, id];
                                            }
                                        });
                                    }}
                                >
                                    <Text variant="bodyMd" as="h3">
                                        {title}
                                    </Text>
                                </ResourceItem>
                            );
                        }}
                    /> 
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
                        onPrevious={() => {setRequestBody({ ...requestBody, searchQuery: searchValue, cursorAfter: '', cursorBefore: pagination.hasPreviousPage ? fetchProducts[0].cursor:''})}}
                        hasNext={pagination.hasNextPage}
                        onNext={() => {setRequestBody({ ...requestBody, searchQuery: searchValue, cursorAfter: pagination.hasNextPage ? fetchProducts[fetchProducts.length-1].cursor:'', cursorBefore: '' })}}
                    />
                    <Button variant="primary" size="large" onClick={() => UploadImageToPrducts(selectedTemplates,selectedItems)} disabled={selectedItems.length > 0 ? false : true} loading={buttonUploadLoading}>Upload Images</Button>
                </InlineStack>
            </Box>
        </Box>
    );
} 